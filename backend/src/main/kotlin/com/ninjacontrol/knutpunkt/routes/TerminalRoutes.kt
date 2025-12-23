package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.models.TerminalMessage
import com.ninjacontrol.knutpunkt.services.TerminalService
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
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
            
            // Handle incoming WebSocket messages in the main coroutine
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
            } finally {
                // WebSocket closed - cancel output job
                logger.debug("WebSocket closed, cleaning up for session $sessionId")
                outputJob.cancel()
            }
            
        } catch (e: Exception) {
            logger.error("Error in terminal WebSocket handler", e)
            sendErrorMessage("Terminal session error: ${e.message}")
        } finally {
            // Session persists after WebSocket disconnect - only log the closure
            if (sessionId != null) {
                logger.info("WebSocket closed for session $sessionId (session continues running)")
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

        while (isActive) {
            // Use blocking read - will wait for data or stream close
            val len = withContext(Dispatchers.IO) {
                inputStream.read(buffer)
            }

            if (len > 0) {
                val output = String(buffer, 0, len, Charsets.UTF_8)

                // Store output in session buffer
                val session = terminalService.getSession(sessionId)
                session?.let {
                    it.outputBuffer.addLast(output)
                    // Trim buffer if it exceeds max size
                    while (it.outputBuffer.size > it.maxBufferSize) {
                        it.outputBuffer.removeFirst()
                    }
                }

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
        }

        logger.debug("PTY output reader finished for session $sessionId")
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
