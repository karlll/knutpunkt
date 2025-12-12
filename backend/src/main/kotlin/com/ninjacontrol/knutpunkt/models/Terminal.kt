package com.ninjacontrol.knutpunkt.models

import com.pty4j.PtyProcess
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class TerminalMessage(
    val type: String, // "input", "resize", "output", "error", "exit"
    val data: String? = null,
    val cols: Int? = null,
    val rows: Int? = null,
    val code: Int? = null,
    val message: String? = null
)

data class TerminalSession(
    val id: String,
    val ptyProcess: PtyProcess,
    val createdAt: Instant,
    var lastActivity: Instant,
    val workingDirectory: String
)
