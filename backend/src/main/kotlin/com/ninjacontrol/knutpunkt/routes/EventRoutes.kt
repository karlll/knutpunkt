package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.services.TaskEventService
import com.ninjacontrol.knutpunkt.services.FileEventService
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import kotlinx.coroutines.flow.catch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("EventRoutes")

fun Route.eventRoutes(
    taskEventService: TaskEventService,
    fileEventService: FileEventService
) {
    // High-level task events
    sse("/events/tasks") {
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

    // Low-level file events
    sse("/events/files") {
        logger.info("SSE client connected to file events")

        try {
            fileEventService.events
                .catch { e ->
                    logger.error("Error in SSE file event stream: ${e.message}", e)
                }
                .collect { fileEvent ->
                    val eventData = Json.encodeToString(fileEvent)
                    send(
                        data = eventData,
                        event = fileEvent.eventType,
                        id = fileEvent.timestamp.toString()
                    )
                    logger.debug("Sent SSE event: ${fileEvent.eventType} for file ${fileEvent.path}")
                }
        } catch (e: Exception) {
            logger.error("SSE connection error: ${e.message}", e)
        } finally {
            logger.info("SSE client disconnected from file events")
        }
    }
}
