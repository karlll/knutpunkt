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
            
            // Launch coroutine to read from PTY and send to WebSocket
            val outputJob = launch {
                try {
                    readPtyOutput(session.ptyProcess.inputStream, sessionId, terminalService)
                } catch (e: Exception) {
                    logger.error("Error reading PTY output for session $sessionId", e)
                    sendErrorMessage("PTY output error: ${e.message}")
                }
            }
            
            // Handle incoming WebSocket messages
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
            } catch (e: Exception) {
                logger.error("Error handling WebSocket messages for session $sessionId", e)
            }
            
            outputJob.cancelAndJoin()
            
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
        while (isActive) {
            val available = inputStream.available()
            if (available > 0) {
                val len = inputStream.read(buffer, 0, minOf(available, buffer.size))
                if (len > 0) {
                    val output = String(buffer, 0, len, Charsets.UTF_8)
                    val message = TerminalMessage(type = "output", data = output)
                    send(Frame.Text(Json.encodeToString(message)))
                    terminalService.updateActivity(sessionId)
                } else if (len < 0) {
                    // End of stream
                    val exitMessage = TerminalMessage(type = "exit", code = 0)
                    send(Frame.Text(Json.encodeToString(exitMessage)))
                    break
                }
            } else {
                delay(10) // Small delay to avoid busy-waiting
            }
        }
    } catch (e: Exception) {
        logger.error("Error in PTY output reader for session $sessionId", e)
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
