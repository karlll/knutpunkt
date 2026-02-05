package com.ninjacontrol.knutpunkt.services

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.io.File
import java.nio.channels.FileChannel
import java.nio.channels.FileLock
import java.nio.file.StandardOpenOption

@Serializable
data class ApplicationState(
    val task_counter: Int = 0,
    val title: String? = null
)

class StateService(private val tasksDirectory: String) {
    
    private val logger = LoggerFactory.getLogger(StateService::class.java)
    private val stateFile = File(tasksDirectory, "state.json")
    private val json = Json { prettyPrint = true }
    
    init {
        ensureStateFileExists()
    }
    
    private fun ensureStateFileExists() {
        if (!stateFile.exists()) {
            val initialState = ApplicationState(task_counter = 0)
            writeState(initialState)
            logger.info("Created state file: ${stateFile.absolutePath}")
        } else {
            logger.info("Using existing state file: ${stateFile.absolutePath}")
        }
    }
    
    private fun readState(): ApplicationState {
        return try {
            val content = stateFile.readText()
            json.decodeFromString<ApplicationState>(content)
        } catch (e: Exception) {
            logger.warn("Failed to read state file, reinitializing: ${e.message}")
            ApplicationState(task_counter = 0)
        }
    }
    
    private fun writeState(state: ApplicationState) {
        val content = json.encodeToString(state)
        stateFile.writeText(content)
    }
    
    @Synchronized
    fun getNextTaskNumber(): Int {
        // Use file locking for thread safety
        FileChannel.open(
            stateFile.toPath(),
            StandardOpenOption.READ,
            StandardOpenOption.WRITE
        ).use { channel ->
            channel.lock().use { lock ->
                val state = readState()
                val nextNumber = state.task_counter + 1
                val newState = state.copy(task_counter = nextNumber)
                writeState(newState)
                
                logger.debug("Allocated task number: {}", nextNumber)
                return nextNumber
            }
        }
    }
    
    fun getCurrentCounter(): Int {
        return readState().task_counter
    }

    fun getTitle(): String? {
        return readState().title
    }

    @Synchronized
    fun setTitle(title: String) {
        // Use file locking for thread safety
        FileChannel.open(
            stateFile.toPath(),
            StandardOpenOption.READ,
            StandardOpenOption.WRITE
        ).use { channel ->
            channel.lock().use { lock ->
                val state = readState()
                val newState = state.copy(title = title)
                writeState(newState)

                logger.debug("Updated title: {}", title)
            }
        }
    }
}
