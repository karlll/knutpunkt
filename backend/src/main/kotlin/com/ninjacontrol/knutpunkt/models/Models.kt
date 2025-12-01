package com.ninjacontrol.knutpunkt.models

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object TaskStatusSerializer : KSerializer<TaskStatus> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("TaskStatus", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: TaskStatus) {
        encoder.encodeString(value.name.lowercase())
    }

    override fun deserialize(decoder: Decoder): TaskStatus {
        return TaskStatus.valueOf(decoder.decodeString().uppercase())
    }
}

object TaskPrioritySerializer : KSerializer<TaskPriority> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("TaskPriority", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: TaskPriority) {
        encoder.encodeString(value.name.lowercase())
    }

    override fun deserialize(decoder: Decoder): TaskPriority {
        return TaskPriority.valueOf(decoder.decodeString().uppercase())
    }
}

@Serializable(with = TaskStatusSerializer::class)
enum class TaskStatus {
    PLANNED,
    ONGOING,
    DONE;

    override fun toString(): String = name.lowercase()
}

@Serializable(with = TaskPrioritySerializer::class)
enum class TaskPriority {
    LOW,
    MEDIUM,
    HIGH;

    override fun toString(): String = name.lowercase()
}

@Serializable
data class Task(
    val id: String,
    val number: Int,
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
