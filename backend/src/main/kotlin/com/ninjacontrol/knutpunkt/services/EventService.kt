package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskEvent
import com.ninjacontrol.knutpunkt.models.TaskStatus
import com.ninjacontrol.knutpunkt.utils.MarkdownParser
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.slf4j.LoggerFactory
import java.io.File
import java.util.concurrent.ConcurrentHashMap

class EventService(
    private val fileWatchService: FileWatchService,
    private val tasksDirectory: String,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob()),
    private val moveDetectionWindowMs: Long = 2000 // 2 second window for detecting moves
) : TaskEventEmitter {
    private val logger = LoggerFactory.getLogger(EventService::class.java)
    
    // Cache: filename -> task ID mapping
    private val filenameToIdCache = ConcurrentHashMap<String, String>()
    
    // Move detection: track recent deletes
    private val recentDeletes = ConcurrentHashMap<String, PendingDelete>()
    
    // Track recently emitted events to avoid duplicates from filesystem
    private val recentlyEmittedEvents = ConcurrentHashMap<String, Long>()
    private val recentEventWindowMs = 5000L // 5 second window
    
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
        bootstrapCache()
        start()
        startCleanupTask()
    }
    
    /**
     * Bootstrap the cache by scanning all existing task files.
     * This ensures the cache is populated even after server restart.
     */
    private fun bootstrapCache() {
        try {
            val baseDir = File(tasksDirectory)
            if (!baseDir.exists()) {
                logger.warn("Tasks directory does not exist: $tasksDirectory")
                return
            }
            
            var count = 0
            TaskStatus.values().forEach { status ->
                val dir = File(baseDir, status.toString().lowercase())
                if (!dir.exists()) return@forEach
                
                dir.listFiles { f -> f.name.endsWith(".md") }?.forEach { file ->
                    try {
                        val (frontMatter, _) = MarkdownParser.parseTaskFile(file)
                        filenameToIdCache[file.name] = frontMatter.id
                        count++
                    } catch (e: Exception) {
                        logger.warn("Failed to parse ${file.name} during cache bootstrap: ${e.message}")
                    }
                }
            }
            logger.info("Cache bootstrapped with $count tasks")
        } catch (e: Exception) {
            logger.error("Error bootstrapping cache: ${e.message}", e)
        }
    }
    
    /**
     * Emit an event directly from TaskService.
     * This is the primary event source for API operations.
     */
    override suspend fun emit(event: TaskEvent) {
        // Mark as recently emitted to avoid duplicate from filesystem
        val eventKey = "${event.eventType}:${event.taskId}"
        recentlyEmittedEvents[eventKey] = System.currentTimeMillis()
        
        _events.emit(event)
        logger.debug("Emitted task event from TaskService: ${event.eventType} for task ${event.taskId}")
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
                
                // Cleanup pending deletes
                recentDeletes.entries.removeIf { (_, delete) ->
                    now - delete.timestamp > moveDetectionWindowMs
                }
                
                // Cleanup recent events tracking
                recentlyEmittedEvents.entries.removeIf { (_, timestamp) ->
                    now - timestamp > recentEventWindowMs
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
        
        val eventToEmit = if (pendingDelete != null && pendingDelete.taskId == taskId) {
            // This is a MOVE (status change)
            logger.debug("Detected move: $filename from ${pendingDelete.oldStatus} to ${event.status}")
            TaskEvent.TaskModified(taskId, event.status)
        } else {
            // This is a genuine CREATE
            TaskEvent.TaskCreated(taskId, event.status)
        }
        
        // Check if we recently emitted this event from TaskService
        val eventKey = "${eventToEmit.eventType}:${taskId}"
        val recentTimestamp = recentlyEmittedEvents[eventKey]
        val now = System.currentTimeMillis()
        
        if (recentTimestamp != null && (now - recentTimestamp) < recentEventWindowMs) {
            logger.debug("Skipping duplicate filesystem event for $taskId (already emitted from TaskService)")
            // Still update cache
            filenameToIdCache[filename] = taskId
            return
        }
        
        // Emit the event (this is from external/manual file changes)
        _events.emit(eventToEmit)
        logger.debug("Emitted task event from filesystem: ${eventToEmit.eventType} for task $taskId")
        
        // Update cache
        filenameToIdCache[filename] = taskId
    }
    
    private suspend fun handleModify(event: FileChangeEvent.Modified, filename: String) {
        val taskId = extractTaskId(event.file)
        if (taskId == null) {
            logger.warn("Could not extract task ID from modified file: $filename")
            return
        }
        
        // Check if recently emitted from TaskService
        val eventKey = "task.modified:${taskId}"
        val recentTimestamp = recentlyEmittedEvents[eventKey]
        val now = System.currentTimeMillis()
        
        if (recentTimestamp != null && (now - recentTimestamp) < recentEventWindowMs) {
            logger.debug("Skipping duplicate filesystem modify event for $taskId")
            filenameToIdCache[filename] = taskId
            return
        }
        
        _events.emit(TaskEvent.TaskModified(taskId, event.status))
        logger.debug("Emitted task event from filesystem: task.modified for task $taskId")
        
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
                // Check if recently emitted from TaskService
                val eventKey = "task.deleted:${taskId}"
                val recentTimestamp = recentlyEmittedEvents[eventKey]
                val now = System.currentTimeMillis()
                
                if (recentTimestamp != null && (now - recentTimestamp) < recentEventWindowMs) {
                    logger.debug("Skipping duplicate filesystem delete event for $taskId")
                    filenameToIdCache.remove(filename)
                    return@launch
                }
                
                _events.emit(TaskEvent.TaskDeleted(taskId, event.status))
                logger.debug("Emitted task event from filesystem: task.deleted for task $taskId")
                
                // Remove from cache
                filenameToIdCache.remove(filename)
            }
        }
    }
    
    private fun extractTaskId(file: File): String? {
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
        recentlyEmittedEvents.clear()
        logger.info("EventService closed")
    }
}
