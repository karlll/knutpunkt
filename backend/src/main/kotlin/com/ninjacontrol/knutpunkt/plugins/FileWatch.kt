package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.services.EventService
import com.ninjacontrol.knutpunkt.services.FileWatchService
import com.ninjacontrol.knutpunkt.services.TaskService
import io.ktor.server.application.*
import kotlinx.coroutines.*
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("FileWatchPlugin")

fun Application.configureFileWatch(taskService: TaskService, tasksDirectory: String): EventService {
    val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    val fileWatchService = FileWatchService(tasksDirectory, scope)
    val eventService = EventService(fileWatchService, scope)
    
    // Start watching for file changes
    fileWatchService.start()
    logger.info("FileWatchService started for directory: $tasksDirectory")
    
    // Set up automatic cache invalidation
    val invalidationJob = scope.launch {
        fileWatchService.events.collect { event ->
            logger.debug("File change detected: ${event.file.name} (${event::class.simpleName})")
            taskService.invalidateCache()
        }
    }
    
    logger.info("Automatic cache invalidation configured")
    
    // Clean up on application shutdown
    environment.monitor.subscribe(ApplicationStopping) {
        logger.info("Stopping FileWatchService and EventService")
        invalidationJob.cancel()
        eventService.close()
        fileWatchService.close()
        scope.cancel()
    }
    
    return eventService
}
