package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.slf4j.LoggerFactory

/**
 * TaskEventService - High-level business event stream
 * 
 * Emits semantic events about task operations:
 * - TaskCreated: A new task was created via the API
 * - TaskUpdated: A task was modified via the API (includes change details)
 * - TaskDeleted: A task was deleted via the API
 * 
 * These events represent user actions and business logic, NOT filesystem changes.
 * They are deterministic, always accurate, and never duplicated.
 */
class TaskEventService(
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
) : TaskEventEmitter {
    
    private val logger = LoggerFactory.getLogger(TaskEventService::class.java)
    
    private val _events = MutableSharedFlow<TaskEvent>(
        replay = 0,
        extraBufferCapacity = 100,
        onBufferOverflow = kotlinx.coroutines.channels.BufferOverflow.DROP_OLDEST
    )
    
    val events: SharedFlow<TaskEvent> = _events.asSharedFlow()
    
    /**
     * Emit a task event.
     * Called by TaskService after successful operations.
     */
    override suspend fun emit(event: TaskEvent) {
        _events.emit(event)
        logger.info("Task event: ${event.eventType} - taskId=${event.taskId}")
    }
    
    fun close() {
        // Nothing to clean up, events will naturally complete when scope is cancelled
        logger.info("TaskEventService closed")
    }
}
