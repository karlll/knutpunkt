package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.FileEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory

/**
 * FileEventService - Low-level filesystem event stream
 * 
 * Emits events about filesystem changes:
 * - FileCreated: A .md file was created
 * - FileModified: A .md file was modified
 * - FileDeleted: A .md file was deleted
 * 
 * These events represent infrastructure-level changes for cache invalidation
 * and external synchronization. They do NOT represent user actions.
 */
class FileEventService(
    private val fileWatchService: FileWatchService,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
) {
    
    private val logger = LoggerFactory.getLogger(FileEventService::class.java)
    
    private val _events = MutableSharedFlow<FileEvent>(
        replay = 0,
        extraBufferCapacity = 100,
        onBufferOverflow = kotlinx.coroutines.channels.BufferOverflow.DROP_OLDEST
    )
    
    val events: SharedFlow<FileEvent> = _events.asSharedFlow()
    
    private var collectJob: kotlinx.coroutines.Job? = null
    
    init {
        start()
    }
    
    private fun start() {
        collectJob = scope.launch {
            fileWatchService.events.collect { fileChange ->
                try {
                    logger.debug("Processing FileChangeEvent: ${fileChange::class.simpleName} - ${fileChange.file.name}")
                    
                    val fileEvent = when (fileChange) {
                        is FileChangeEvent.Created -> FileEvent.FileCreated(
                            path = fileChange.file.absolutePath,
                            timestamp = System.currentTimeMillis(),
                            directory = fileChange.status.toString().lowercase()
                        )
                        is FileChangeEvent.Modified -> FileEvent.FileModified(
                            path = fileChange.file.absolutePath,
                            timestamp = System.currentTimeMillis()
                        )
                        is FileChangeEvent.Deleted -> FileEvent.FileDeleted(
                            path = fileChange.file.absolutePath,
                            timestamp = System.currentTimeMillis(),
                            directory = fileChange.status.toString().lowercase()
                        )
                    }
                    
                    _events.emit(fileEvent)
                    logger.debug("Emitted FileEvent: ${fileEvent::class.simpleName} - ${fileChange.file.name}")
                } catch (e: Exception) {
                    logger.error("Error processing file event: ${e.message}", e)
                }
            }
        }
        logger.info("FileEventService started")
    }
    
    fun close() {
        collectJob?.cancel()
        logger.info("FileEventService closed")
    }
}
