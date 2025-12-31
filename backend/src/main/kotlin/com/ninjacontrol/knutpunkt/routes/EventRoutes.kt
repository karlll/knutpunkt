package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.services.TaskEventService
import com.ninjacontrol.knutpunkt.services.FileEventService
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.sse.ServerSentEvent
import io.ktor.util.cio.ChannelWriteException
import kotlin.time.Duration.Companion.milliseconds
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.io.IOException

private val logger = LoggerFactory.getLogger("EventRoutes")

fun Route.eventRoutes(
    taskEventService: TaskEventService,
    fileEventService: FileEventService,
    keepaliveIntervalSeconds: Long = 15
) {
    // High-level task events
    sse("/events/tasks") {
        logger.info("SSE client connected to task events")

        // Configure heartbeat for keepalive
        // Send actual event instead of comment - some clients don't reset timeout on comments
        heartbeat {
            period = (keepaliveIntervalSeconds * 1000).milliseconds
            event = ServerSentEvent(data = "heartbeat", event = "heartbeat")
        }

        try {
            // Send initial ping to establish connection
            send(ServerSentEvent(data = "connected", event = "ping"))
            logger.debug("Sent initial ping to client")

            // Collect and send task events
            taskEventService.events.collect { taskEvent ->
                val eventData = Json.encodeToString(taskEvent)
                send(ServerSentEvent(
                    data = eventData,
                    event = taskEvent.eventType,
                    id = taskEvent.timestamp
                ))
                logger.debug("Sent SSE event: ${taskEvent.eventType} for task ${taskEvent.taskId}")
            }
        } catch (e: CancellationException) {
            // Coroutine cancelled (client disconnected) - this is normal
            logger.debug("SSE session cancelled (client disconnected)")
            throw e  // Re-throw to properly cancel the coroutine
        } catch (e: IOException) {
            // Client disconnected - this is normal
            logger.info("Client disconnected: ${e.message}")
        } catch (e: ChannelWriteException) {
            // Channel closed - this is normal when client disconnects
            logger.info("Channel closed: ${e.message}")
        } catch (e: Exception) {
            // Unexpected error
            logger.error("Unexpected SSE error: ${e.message}", e)
        } finally {
            logger.info("SSE client disconnected from task events")
        }
    }

    // Low-level file events
    sse("/events/files") {
        logger.info("SSE client connected to file events")

        // Configure heartbeat for keepalive
        // Send actual event instead of comment - some clients don't reset timeout on comments
        heartbeat {
            period = (keepaliveIntervalSeconds * 1000).milliseconds
            event = ServerSentEvent(data = "heartbeat", event = "heartbeat")
        }

        try {
            // Send initial ping to establish connection
            send(ServerSentEvent(data = "connected", event = "ping"))
            logger.debug("Sent initial ping to client")

            // Collect and send file events
            fileEventService.events.collect { fileEvent ->
                val eventData = Json.encodeToString(fileEvent)
                send(ServerSentEvent(
                    data = eventData,
                    event = fileEvent.eventType,
                    id = fileEvent.timestamp.toString()
                ))
                logger.debug("Sent SSE event: ${fileEvent.eventType} for file ${fileEvent.path}")
            }
        } catch (e: CancellationException) {
            // Coroutine cancelled (client disconnected) - this is normal
            logger.debug("SSE session cancelled (client disconnected)")
            throw e  // Re-throw to properly cancel the coroutine
        } catch (e: IOException) {
            // Client disconnected - this is normal
            logger.info("Client disconnected: ${e.message}")
        } catch (e: ChannelWriteException) {
            // Channel closed - this is normal when client disconnects
            logger.info("Channel closed: ${e.message}")
        } catch (e: Exception) {
            // Unexpected error
            logger.error("Unexpected SSE error: ${e.message}", e)
        } finally {
            logger.info("SSE client disconnected from file events")
        }
    }
}
