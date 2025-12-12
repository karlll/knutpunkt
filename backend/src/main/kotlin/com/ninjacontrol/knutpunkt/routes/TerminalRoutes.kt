package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.models.TerminalMessage
import com.ninjacontrol.knutpunkt.services.TerminalService
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.selects.select
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.io.InputStream
import java.io.OutputStream

private val logger = LoggerFactory.getLogger("TerminalRoutes")

fun Route.terminalRoutes(terminalService: TerminalService) {
    webSocket("/terminal/session") {
        val taskId = call.request.queryParameters["taskId"]
        var sessionId: String? = null
        
        try {
            val session = terminalService.createSession(taskId)
            sessionId = session.id
            
            logger.info("WebSocket connected for terminal session: $sessionId")
            logger.debug("Launching PTY I/O handlers for session $sessionId")
            
            // Launch coroutine to read from PTY and send to WebSocket
            // Note: PTY streams are counterintuitive:
            // - Read from ptyProcess.inputStream (terminal's output)
            // - Write to ptyProcess.outputStream (terminal's input)
            val outputJob = launch {
                try {
                    readPtyOutput(session.ptyProcess.inputStream, sessionId, terminalService)
                } catch (e: CancellationException) {
                    logger.debug("PTY output reader cancelled for session $sessionId")
                } catch (e: Exception) {
                    logger.error("Error reading PTY output for session $sessionId", e)
                    try {
                        sendErrorMessage("PTY output error: ${e.message}")
                    } catch (ignored: Exception) {
                        // WebSocket might be closed
                    }
                }
            }
            
            // Launch coroutine to handle incoming WebSocket messages
            val inputJob = launch {
                try {
                    for (frame in incoming) {
                        when (frame) {
                            is Frame.Text -> {
                                val text = frame.readText()
                                handleMessage(text, session.ptyProcess.outputStream, terminalService, sessionId)
                            }
                            is Frame.Close -> {
                                logger.info("WebSocket close frame received for session $sessionId")
                                break
                            }
                            else -> {
                                logger.debug("Ignoring non-text frame for session $sessionId")
                            }
                        }
                    }
                } catch (e: CancellationException) {
                    logger.debug("Input handler cancelled for session $sessionId")
                } catch (e: Exception) {
                    logger.error("Error handling WebSocket messages for session $sessionId", e)
                }
            }
            
            // Wait for either job to complete (PTY process exit or WebSocket close)
            try {
                logger.debug("Waiting for jobs to complete for session $sessionId")
                // Wait for either direction to finish
                select<Unit> {
                    outputJob.onJoin {
                        logger.debug("Output job completed for session $sessionId")
                    }
                    inputJob.onJoin {
                        logger.debug("Input job completed for session $sessionId")
                    }
                }
            } finally {
                // Cancel both jobs when one finishes
                logger.debug("Cleaning up jobs for session $sessionId")
                outputJob.cancel()
                inputJob.cancel()
                outputJob.join()
                inputJob.join()
            }
            
        } catch (e: Exception) {
            logger.error("Error in terminal WebSocket handler", e)
            sendErrorMessage("Terminal session error: ${e.message}")
        } finally {
            if (sessionId != null) {
                terminalService.terminateSession(sessionId)
                logger.info("Terminal session cleaned up: $sessionId")
            }
        }
    }
}

private suspend fun DefaultWebSocketServerSession.readPtyOutput(
    inputStream: InputStream,
    sessionId: String,
    terminalService: TerminalService
) {
    val buffer = ByteArray(8192)
    
    try {
        logger.debug("Starting PTY output reader for session $sessionId")
        var bytesRead = 0
        
        while (isActive) {
            // Check if data is available (non-blocking)
            val available = withContext(Dispatchers.IO) {
                inputStream.available()
            }
            
            if (available > 0) {
                // Read available data
                val len = withContext(Dispatchers.IO) {
                    inputStream.read(buffer, 0, minOf(available, buffer.size))
                }
                
                if (len > 0) {
                    bytesRead += len
                    val output = String(buffer, 0, len, Charsets.UTF_8)
                    logger.debug("Read $len bytes from PTY (total: $bytesRead)")
                    
                    val message = TerminalMessage(type = "output", data = output)
                    send(Frame.Text(Json.encodeToString(message)))
                    terminalService.updateActivity(sessionId)
                } else if (len < 0) {
                    // End of stream
                    logger.info("PTY stream ended for session $sessionId")
                    val exitMessage = TerminalMessage(type = "exit", code = 0)
                    send(Frame.Text(Json.encodeToString(exitMessage)))
                    break
                }
            } else {
                // No data available, wait a bit before checking again
                delay(50)
            }
        }
        
        logger.debug("PTY output reader finished for session $sessionId (read $bytesRead bytes total)")
    } catch (e: Exception) {
        logger.error("Error in PTY output reader for session $sessionId: ${e.message}", e)
        throw e
    }
}

private suspend fun DefaultWebSocketServerSession.handleMessage(
    text: String,
    outputStream: OutputStream,
    terminalService: TerminalService,
    sessionId: String
) {
    try {
        val message = Json.decodeFromString<TerminalMessage>(text)
        
        when (message.type) {
            "input" -> {
                message.data?.let { data ->
                    logger.debug("Sending input to PTY (session $sessionId): ${data.replace("\n", "\\n")}")
                    outputStream.write(data.toByteArray(Charsets.UTF_8))
                    outputStream.flush()
                    terminalService.updateActivity(sessionId)
                }
            }
            "resize" -> {
                if (message.cols != null && message.rows != null) {
                    val session = terminalService.getSession(sessionId)
                    session?.ptyProcess?.winSize = com.pty4j.WinSize(message.cols, message.rows)
                    logger.debug("Terminal resized to ${message.cols}x${message.rows} for session $sessionId")
                }
            }
            else -> {
                logger.warn("Unknown message type: ${message.type} for session $sessionId")
            }
        }
    } catch (e: Exception) {
        logger.error("Error handling message for session $sessionId", e)
        sendErrorMessage("Message handling error: ${e.message}")
    }
}

private suspend fun DefaultWebSocketServerSession.sendErrorMessage(errorMessage: String) {
    try {
        val message = TerminalMessage(type = "error", message = errorMessage)
        send(Frame.Text(Json.encodeToString(message)))
    } catch (e: Exception) {
        logger.error("Failed to send error message", e)
    }
}
