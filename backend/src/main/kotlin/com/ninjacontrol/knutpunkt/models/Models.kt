package com.ninjacontrol.knutpunkt.models

import kotlinx.serialization.Serializable

@Serializable
enum class TaskStatus {
    PLANNED,
    ONGOING,
    DONE;
    
    override fun toString(): String = name.lowercase()
}

@Serializable
enum class TaskPriority {
    LOW,
    MEDIUM,
    HIGH;
    
    override fun toString(): String = name.lowercase()
}

@Serializable
data class Task(
    val id: String,
    val title: String,
    val description: String,
    val status: TaskStatus,
    val createdAt: String,
    val updatedAt: String,
    val assignees: List<String>,
    val categories: List<String>,
    val priority: TaskPriority,
    val order: Int
)

@Serializable
data class TaskCreate(
    val title: String,
    val description: String,
    val status: TaskStatus? = TaskStatus.PLANNED,
    val assignees: List<String>? = emptyList(),
    val categories: List<String>? = emptyList(),
    val priority: TaskPriority? = TaskPriority.MEDIUM,
    val order: Int? = null
)

@Serializable
data class TaskUpdate(
    val title: String,
    val description: String,
    val status: TaskStatus? = null,
    val assignees: List<String>? = null,
    val categories: List<String>? = null,
    val priority: TaskPriority? = null,
    val order: Int? = null
)

@Serializable
data class TaskStatusUpdate(
    val status: TaskStatus
)

@Serializable
data class TaskOrderUpdate(
    val newOrder: Int,
    val newStatus: TaskStatus? = null
)

@Serializable
data class TaskOrderResponse(
    val updated: List<Task>
)

@Serializable
data class Error(
    val message: String,
    val code: String? = null,
    val details: Map<String, String>? = null
)
