package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskEvent

/**
 * Interface for emitting task events from TaskService operations.
 * This allows TaskService to directly emit high-level semantic events
 * without relying on filesystem watching.
 */
interface TaskEventEmitter {
    /**
     * Emit a task event.
     * This should be called after the corresponding operation has successfully completed.
     */
    suspend fun emit(event: TaskEvent)
}
