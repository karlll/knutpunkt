package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.services.EventService
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import kotlinx.coroutines.flow.catch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("EventRoutes")

fun Route.eventRoutes(eventService: EventService) {
    sse("/events") {
        logger.info("SSE client connected")
        
        try {
            eventService.events
                .catch { e ->
                    logger.error("Error in SSE event stream: ${e.message}", e)
                }
                .collect { taskEvent ->
                    val eventData = Json.encodeToString(taskEvent)
                    send(
                        data = eventData,
                        event = taskEvent.eventType,
                        id = System.currentTimeMillis().toString()
                    )
                    logger.debug("Sent SSE event: ${taskEvent.eventType} for task ${taskEvent.taskId}")
                }
        } catch (e: Exception) {
            logger.error("SSE connection error: ${e.message}", e)
        } finally {
            logger.info("SSE client disconnected")
        }
    }
}
