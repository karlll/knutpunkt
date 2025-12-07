package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.services.TaskEventService
import com.ninjacontrol.knutpunkt.services.FileEventService
import com.ninjacontrol.knutpunkt.services.FileWatchService
import com.ninjacontrol.knutpunkt.services.TaskService
import io.ktor.server.application.*
import kotlinx.coroutines.*
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger("FileWatchPlugin")

data class EventServices(
    val taskEventService: TaskEventService,
    val fileEventService: FileEventService
)

fun Application.configureFileWatch(taskService: TaskService, tasksDirectory: String): EventServices {
    val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    val fileWatchService = FileWatchService(tasksDirectory, scope)
    
    // Create both event services
    val taskEventService = TaskEventService(scope)
    val fileEventService = FileEventService(fileWatchService, scope)
    
    // Set the task event emitter in TaskService
    taskService.setEventEmitter(taskEventService)
    
    // Start watching for file changes
    fileWatchService.start()
    logger.info("FileWatchService started for directory: $tasksDirectory")
    
    // Set up automatic cache invalidation from file events
    val invalidationJob = scope.launch {
        fileWatchService.events.collect { event ->
            logger.debug("File change detected: ${event.file.name} (${event::class.simpleName})")
            taskService.invalidateCache()
        }
    }
    
    logger.info("Automatic cache invalidation configured")
    
    // Clean up on application shutdown
    environment.monitor.subscribe(ApplicationStopping) {
        logger.info("Stopping FileWatchService and EventServices")
        invalidationJob.cancel()
        taskEventService.close()
        fileEventService.close()
        fileWatchService.close()
        scope.cancel()
    }
    
    return EventServices(taskEventService, fileEventService)
}
