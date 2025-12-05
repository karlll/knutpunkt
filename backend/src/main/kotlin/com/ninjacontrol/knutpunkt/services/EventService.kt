package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskEvent
import com.ninjacontrol.knutpunkt.utils.MarkdownParser
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.slf4j.LoggerFactory

class EventService(
    private val fileWatchService: FileWatchService,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
) {
    private val logger = LoggerFactory.getLogger(EventService::class.java)
    private val _events = MutableSharedFlow<TaskEvent>(
        replay = 0,
        extraBufferCapacity = 100,
        onBufferOverflow = kotlinx.coroutines.channels.BufferOverflow.DROP_OLDEST
    )
    
    val events: SharedFlow<TaskEvent> = _events.asSharedFlow()
    
    private var collectJob: Job? = null
    
    init {
        start()
    }
    
    private fun start() {
        collectJob = scope.launch {
            fileWatchService.events.collect { fileEvent ->
                try {
                    val taskEvent = convertToTaskEvent(fileEvent)
                    if (taskEvent != null) {
                        _events.emit(taskEvent)
                        logger.debug("Emitted task event: ${taskEvent.eventType} for task ${taskEvent.taskId}")
                    }
                } catch (e: Exception) {
                    logger.error("Error converting file event to task event: ${e.message}", e)
                }
            }
        }
        logger.info("EventService started")
    }
    
    private fun convertToTaskEvent(fileEvent: FileChangeEvent): TaskEvent? {
        val taskId = when (fileEvent) {
            is FileChangeEvent.Created -> extractTaskId(fileEvent.file)
            is FileChangeEvent.Modified -> extractTaskId(fileEvent.file)
            is FileChangeEvent.Deleted -> extractTaskIdFromFilename(fileEvent.file.name)
        }
        
        if (taskId == null) {
            logger.warn("Could not extract task ID from file: ${fileEvent.file.name}")
            return null
        }
        
        return when (fileEvent) {
            is FileChangeEvent.Created -> TaskEvent.TaskCreated(taskId, fileEvent.status)
            is FileChangeEvent.Modified -> TaskEvent.TaskModified(taskId, fileEvent.status)
            is FileChangeEvent.Deleted -> TaskEvent.TaskDeleted(taskId, fileEvent.status)
        }
    }
    
    private fun extractTaskId(file: java.io.File): String? {
        return try {
            if (!file.exists()) return null
            val (frontMatter, _) = MarkdownParser.parseTaskFile(file)
            frontMatter.id
        } catch (e: Exception) {
            logger.warn("Failed to extract task ID from ${file.name}: ${e.message}")
            null
        }
    }
    
    private fun extractTaskIdFromFilename(filename: String): String? {
        // For deleted files, we can't read the content
        // This is a limitation - we'll return null for now
        // Future enhancement: cache filename -> ID mapping
        logger.debug("Cannot extract task ID from deleted file: $filename")
        return null
    }
    
    fun close() {
        collectJob?.cancel()
        logger.info("EventService closed")
    }
}
