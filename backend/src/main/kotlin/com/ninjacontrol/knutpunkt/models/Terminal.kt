package com.ninjacontrol.knutpunkt.models

import com.pty4j.PtyProcess
import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.concurrent.ConcurrentLinkedDeque

@Serializable
data class TerminalMessage(
    val type: String, // "input", "resize", "output", "error", "exit"
    val data: String? = null,
    val cols: Int? = null,
    val rows: Int? = null,
    val code: Int? = null,
    val message: String? = null
)

@Serializable
data class SessionInfo(
    val id: String,
    val name: String,
    val createdAt: String, // ISO-8601
    val lastActivity: String, // ISO-8601
    val taskId: String?,
    val workingDirectory: String
)

data class TerminalSession(
    val id: String,
    var name: String,
    val ptyProcess: PtyProcess,
    val createdAt: Instant,
    var lastActivity: Instant,
    val workingDirectory: String,
    val taskId: String? = null,
    val outputBuffer: ConcurrentLinkedDeque<String> = ConcurrentLinkedDeque(),
    val maxBufferSize: Int
)
