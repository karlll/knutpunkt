package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.SessionInfo
import com.ninjacontrol.knutpunkt.models.TerminalSession
import com.pty4j.PtyProcessBuilder
import kotlinx.coroutines.*
import org.slf4j.LoggerFactory
import java.io.File
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class TerminalService(
    private val tasksDirectory: String,
    private val scope: CoroutineScope,
    private val idleTimeoutMinutes: Long = 30L,
    private val outputBufferSize: Int = 100
) {
    private val logger = LoggerFactory.getLogger(TerminalService::class.java)
    private val sessions = ConcurrentHashMap<String, TerminalSession>()
    private val sessionCounter = AtomicInteger(0)
    
    init {
        startTimeoutCleanup()
    }
    
    fun createSession(taskId: String? = null): TerminalSession {
        val workingDir = determineWorkingDirectory(taskId)
        val shell = detectShell()
        
        logger.info("Creating terminal session with shell: $shell, workingDir: $workingDir")
        
        val pty = try {
            PtyProcessBuilder()
                .setCommand(arrayOf(shell, "-i"))
                .setDirectory(workingDir.absolutePath)
                .setEnvironment(buildEnvironment(taskId))
                .setInitialColumns(80)
                .setInitialRows(24)
                .start()
        } catch (e: Exception) {
            logger.error("Failed to spawn PTY process", e)
            throw IllegalStateException("Failed to create terminal session: ${e.message}", e)
        }
        
        val sessionId = UUID.randomUUID().toString()
        val sessionNumber = sessionCounter.incrementAndGet()
        val sessionName = "Terminal session $sessionNumber"

        val session = TerminalSession(
            id = sessionId,
            name = sessionName,
            ptyProcess = pty,
            createdAt = Instant.now(),
            lastActivity = Instant.now(),
            workingDirectory = workingDir.absolutePath,
            taskId = taskId,
            maxBufferSize = outputBufferSize
        )

        sessions[sessionId] = session
        logger.info("Terminal session created: $sessionId")

        return session
    }

    fun listSessions(): List<SessionInfo> {
        return sessions.values.map { session ->
            SessionInfo(
                id = session.id,
                name = session.name,
                createdAt = session.createdAt.toString(),
                lastActivity = session.lastActivity.toString(),
                taskId = session.taskId,
                workingDirectory = session.workingDirectory
            )
        }
    }
    
    fun getSession(sessionId: String): TerminalSession? {
        return sessions[sessionId]?.also {
            it.lastActivity = Instant.now()
        }
    }
    
    fun terminateSession(sessionId: String) {
        sessions.remove(sessionId)?.let { session ->
            try {
                session.ptyProcess.destroy()
                logger.info("Terminal session terminated: $sessionId")
            } catch (e: Exception) {
                logger.error("Error terminating PTY process for session $sessionId", e)
            }
        }
    }
    
    fun updateActivity(sessionId: String) {
        sessions[sessionId]?.lastActivity = Instant.now()
    }

    fun renameSession(sessionId: String, newName: String): Boolean {
        return sessions[sessionId]?.let { session ->
            session.name = newName
            logger.info("Terminal session renamed: $sessionId -> $newName")
            true
        } ?: false
    }
    
    private fun determineWorkingDirectory(taskId: String?): File {
        val tasksDir = File(tasksDirectory).absoluteFile
        val projectRoot = tasksDir.parentFile ?: tasksDir
        
        // Ensure the directory exists and is safe
        if (!projectRoot.exists()) {
            throw IllegalStateException("Working directory does not exist: ${projectRoot.absolutePath}")
        }
        
        return projectRoot
    }
    
    private fun detectShell(): String {
        val shell = System.getenv("SHELL")
        
        return when {
            shell?.contains("zsh") == true -> shell
            shell?.contains("bash") == true -> shell
            File("/bin/zsh").exists() -> "/bin/zsh"
            File("/bin/bash").exists() -> "/bin/bash"
            else -> "/bin/sh"
        }
    }
    
    private fun buildEnvironment(taskId: String?): Map<String, String> {
        val env = System.getenv().toMutableMap()
        env["TERM"] = "xterm-256color"
        
        if (taskId != null) {
            env["TASK_ID"] = taskId
        }
        
        return env
    }
    
    private fun startTimeoutCleanup() {
        scope.launch {
            while (isActive) {
                delay(60_000) // Check every minute
                
                val now = Instant.now()
                val expiredSessions = sessions.filter { (_, session) ->
                    val idleMinutes = java.time.Duration.between(session.lastActivity, now).toMinutes()
                    idleMinutes >= idleTimeoutMinutes
                }
                
                expiredSessions.keys.forEach { sessionId ->
                    logger.info("Terminating idle session: $sessionId")
                    terminateSession(sessionId)
                }
            }
        }
    }
    
    fun close() {
        logger.info("Closing TerminalService, terminating ${sessions.size} active sessions")
        sessions.keys.toList().forEach { sessionId ->
            terminateSession(sessionId)
        }
    }
}
