package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskEvent
import com.ninjacontrol.knutpunkt.models.TaskStatus
import com.ninjacontrol.knutpunkt.utils.MarkdownParser
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap

class EventService(
    private val fileWatchService: FileWatchService,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob()),
    private val moveDetectionWindowMs: Long = 2000 // 2 second window for detecting moves
) {
    private val logger = LoggerFactory.getLogger(EventService::class.java)
    
    // Cache: filename -> task ID mapping
    private val filenameToIdCache = ConcurrentHashMap<String, String>()
    
    // Move detection: track recent deletes
    private val recentDeletes = ConcurrentHashMap<String, PendingDelete>()
    
    private data class PendingDelete(
        val taskId: String,
        val oldStatus: TaskStatus,
        val timestamp: Long
    )
    
    private val _events = MutableSharedFlow<TaskEvent>(
        replay = 0,
        extraBufferCapacity = 100,
        onBufferOverflow = kotlinx.coroutines.channels.BufferOverflow.DROP_OLDEST
    )
    
    val events: SharedFlow<TaskEvent> = _events.asSharedFlow()
    
    private var collectJob: Job? = null
    private var cleanupJob: Job? = null
    
    init {
        start()
        startCleanupTask()
    }
    
    private fun start() {
        collectJob = scope.launch {
            fileWatchService.events.collect { fileEvent ->
                try {
                    processFileEvent(fileEvent)
                } catch (e: Exception) {
                    logger.error("Error processing file event: ${e.message}", e)
                }
            }
        }
        logger.info("EventService started")
    }
    
    private fun startCleanupTask() {
        cleanupJob = scope.launch {
            while (isActive) {
                delay(moveDetectionWindowMs)
                val now = System.currentTimeMillis()
                recentDeletes.entries.removeIf { (_, delete) ->
                    now - delete.timestamp > moveDetectionWindowMs
                }
            }
        }
    }
    
    private suspend fun processFileEvent(fileEvent: FileChangeEvent) {
        val filename = fileEvent.file.name
        
        when (fileEvent) {
            is FileChangeEvent.Created -> handleCreate(fileEvent, filename)
            is FileChangeEvent.Modified -> handleModify(fileEvent, filename)
            is FileChangeEvent.Deleted -> handleDelete(fileEvent, filename)
        }
    }
    
    private suspend fun handleCreate(event: FileChangeEvent.Created, filename: String) {
        val taskId = extractTaskId(event.file)
        if (taskId == null) {
            logger.warn("Could not extract task ID from created file: $filename")
            return
        }
        
        // Check if this is a move operation (delete + create)
        val pendingDelete = recentDeletes.remove(filename)
        
        if (pendingDelete != null && pendingDelete.taskId == taskId) {
            // This is a MOVE (status change)
            logger.debug("Detected move: $filename from ${pendingDelete.oldStatus} to ${event.status}")
            _events.emit(TaskEvent.TaskModified(taskId, event.status))
            logger.debug("Emitted task event: task.modified for task $taskId (status change: ${pendingDelete.oldStatus} -> ${event.status})")
        } else {
            // This is a genuine CREATE
            _events.emit(TaskEvent.TaskCreated(taskId, event.status))
            logger.debug("Emitted task event: task.created for task $taskId")
        }
        
        // Update cache
        filenameToIdCache[filename] = taskId
    }
    
    private suspend fun handleModify(event: FileChangeEvent.Modified, filename: String) {
        val taskId = extractTaskId(event.file)
        if (taskId == null) {
            logger.warn("Could not extract task ID from modified file: $filename")
            return
        }
        
        _events.emit(TaskEvent.TaskModified(taskId, event.status))
        logger.debug("Emitted task event: task.modified for task $taskId")
        
        // Update cache
        filenameToIdCache[filename] = taskId
    }
    
    private suspend fun handleDelete(event: FileChangeEvent.Deleted, filename: String) {
        // Try to get task ID from cache first
        val taskId = filenameToIdCache[filename]
        
        if (taskId == null) {
            logger.warn("Could not find task ID in cache for deleted file: $filename")
            return
        }
        
        // Store as pending delete (might be a move operation)
        recentDeletes[filename] = PendingDelete(
            taskId = taskId,
            oldStatus = event.status,
            timestamp = System.currentTimeMillis()
        )
        
        logger.debug("Stored pending delete for $filename (taskId: $taskId, status: ${event.status})")
        
        // Schedule emission of delete event if not matched by create within window
        scope.launch {
            delay(moveDetectionWindowMs)
            
            // If still in pending deletes, it's a real delete (not a move)
            if (recentDeletes.remove(filename) != null) {
                _events.emit(TaskEvent.TaskDeleted(taskId, event.status))
                logger.debug("Emitted task event: task.deleted for task $taskId")
                
                // Remove from cache
                filenameToIdCache.remove(filename)
            }
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
    
    fun close() {
        collectJob?.cancel()
        cleanupJob?.cancel()
        filenameToIdCache.clear()
        recentDeletes.clear()
        logger.info("EventService closed")
    }
}
