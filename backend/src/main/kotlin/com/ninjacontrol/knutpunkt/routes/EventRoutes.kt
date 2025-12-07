package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.services.TaskEventService
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import kotlinx.coroutines.flow.catch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("EventRoutes")

fun Route.taskEventRoutes(taskEventService: TaskEventService) {
    sse("/events") {
        logger.info("SSE client connected to task events")
        
        try {
            taskEventService.events
                .catch { e ->
                    logger.error("Error in SSE task event stream: ${e.message}", e)
                }
                .collect { taskEvent ->
                    val eventData = Json.encodeToString(taskEvent)
                    send(
                        data = eventData,
                        event = taskEvent.eventType,
                        id = taskEvent.timestamp
                    )
                    logger.debug("Sent SSE event: ${taskEvent.eventType} for task ${taskEvent.taskId}")
                }
        } catch (e: Exception) {
            logger.error("SSE connection error: ${e.message}", e)
        } finally {
            logger.info("SSE client disconnected from task events")
        }
    }
}
