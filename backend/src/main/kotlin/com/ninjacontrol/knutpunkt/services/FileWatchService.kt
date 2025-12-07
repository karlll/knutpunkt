package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskStatus
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.slf4j.LoggerFactory
import java.io.File
import java.nio.file.*
import java.util.concurrent.ConcurrentHashMap

sealed class FileChangeEvent {
    abstract val file: File
    abstract val status: TaskStatus
    
    data class Created(override val file: File, override val status: TaskStatus) : FileChangeEvent()
    data class Modified(override val file: File, override val status: TaskStatus) : FileChangeEvent()
    data class Deleted(override val file: File, override val status: TaskStatus) : FileChangeEvent()
}

class FileWatchService(
    private val tasksDirectory: String,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
) {
    private val logger = LoggerFactory.getLogger(FileWatchService::class.java)
    private val watchService: WatchService = FileSystems.getDefault().newWatchService()
    private val watchKeys = ConcurrentHashMap<WatchKey, Pair<Path, TaskStatus>>()
    private var watchJob: Job? = null
    
    // Use SharedFlow instead of Channel so multiple collectors can receive events
    private val _events = MutableSharedFlow<FileChangeEvent>(
        replay = 0,
        extraBufferCapacity = 100,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    
    val events: SharedFlow<FileChangeEvent> = _events.asSharedFlow()
    
    init {
        registerDirectories()
    }
    
    private fun registerDirectories() {
        val baseDir = File(tasksDirectory).apply {
            if (!exists()) {
                mkdirs()
                logger.info("Created tasks directory: $absolutePath")
            }
        }
        
        TaskStatus.values().forEach { status ->
            val dirName = status.toString().lowercase()
            val dir = File(baseDir, dirName).apply {
                if (!exists()) {
                    mkdirs()
                    logger.debug("Created status directory: $absolutePath")
                }
            }
            
            try {
                val watchKey = dir.toPath().register(
                    watchService,
                    StandardWatchEventKinds.ENTRY_CREATE,
                    StandardWatchEventKinds.ENTRY_MODIFY,
                    StandardWatchEventKinds.ENTRY_DELETE
                )
                watchKeys[watchKey] = dir.toPath() to status
                logger.info("Watching directory: ${dir.absolutePath} (status: $status)")
            } catch (e: Exception) {
                logger.error("Failed to register watch for ${dir.absolutePath}: ${e.message}", e)
            }
        }
    }
    
    fun start() {
        if (watchJob?.isActive == true) {
            logger.warn("FileWatchService is already running")
            return
        }
        
        watchJob = scope.launch {
            logger.info("FileWatchService started")
            try {
                while (isActive) {
                    processEvents()
                }
            } catch (e: CancellationException) {
                logger.info("FileWatchService cancelled")
                throw e
            } catch (e: java.nio.file.ClosedWatchServiceException) {
                logger.debug("WatchService closed - stopping event processing")
            } catch (e: Exception) {
                logger.error("FileWatchService encountered error: ${e.message}", e)
            }
        }
    }
    
    private suspend fun processEvents() {
        val key = withContext(Dispatchers.IO) {
            watchService.take()
        }
        
        val (path, status) = watchKeys[key] ?: run {
            logger.warn("Received event for unregistered watch key")
            key.reset()
            return
        }
        
        for (event in key.pollEvents()) {
            val kind = event.kind()
            
            if (kind == StandardWatchEventKinds.OVERFLOW) {
                logger.warn("WatchService overflow - some events may have been lost")
                continue
            }
            
            @Suppress("UNCHECKED_CAST")
            val ev = event as WatchEvent<Path>
            val filename = ev.context()
            val file = path.resolve(filename).toFile()
            
            // Only process .md files
            if (!file.name.endsWith(".md")) {
                continue
            }
            
            val changeEvent = when (kind) {
                StandardWatchEventKinds.ENTRY_CREATE -> {
                    logger.debug("File created: ${file.absolutePath} (status: $status)")
                    FileChangeEvent.Created(file, status)
                }
                StandardWatchEventKinds.ENTRY_MODIFY -> {
                    logger.debug("File modified: ${file.absolutePath} (status: $status)")
                    FileChangeEvent.Modified(file, status)
                }
                StandardWatchEventKinds.ENTRY_DELETE -> {
                    logger.debug("File deleted: ${file.absolutePath} (status: $status)")
                    FileChangeEvent.Deleted(file, status)
                }
                else -> null
            }
            
            changeEvent?.let {
                _events.emit(it)
            }
        }
        
        val valid = key.reset()
        if (!valid) {
            watchKeys.remove(key)
            logger.warn("Watch key no longer valid for path: $path")
        }
    }
    
    fun stop() {
        logger.info("Stopping FileWatchService")
        watchJob?.cancel()
        watchJob = null
        
        // SharedFlow doesn't need to be closed
    }
    
    fun close() {
        // Close watch service first to unblock any waiting take() calls
        try {
            watchService.close()
        } catch (e: Exception) {
            logger.warn("Exception while closing watch service: ${e.message}")
        }
        
        // Then cancel the job and cleanup
        watchJob?.cancel()
        watchJob = null
        
        watchKeys.keys.forEach { it.cancel() }
        watchKeys.clear()
        
        // SharedFlow doesn't need to be closed
        
        logger.info("FileWatchService closed")
    }
    
    fun isRunning(): Boolean = watchJob?.isActive == true
}
