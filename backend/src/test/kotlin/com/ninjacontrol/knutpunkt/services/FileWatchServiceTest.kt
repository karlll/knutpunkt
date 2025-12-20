package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskStatus
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import java.io.File
import java.nio.file.Files
import java.io.FileOutputStream

class FileWatchServiceTest {
    
    private lateinit var tempDir: File
    private lateinit var fileWatchService: FileWatchService
    private lateinit var testScope: CoroutineScope
    
    @BeforeEach
    fun setup() {
        tempDir = Files.createTempDirectory("file-watch-test").toFile()
        testScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
        fileWatchService = FileWatchService(tempDir.absolutePath, testScope)
    }
    
    @AfterEach
    fun cleanup() {
        runBlocking {
            fileWatchService.close()
            testScope.cancel()
            tempDir.deleteRecursively()
        }
    }
    
    // Helper to write file and ensure it's synced to disk (important for CI environments)
    private fun File.writeAndSync(content: String) {
        writeText(content)
        FileOutputStream(this, true).use { it.fd.sync() }
    }
    
    @Test
    fun `service creates directories on initialization`() {
        val plannedDir = File(tempDir, "planned")
        val ongoingDir = File(tempDir, "ongoing")
        val doneDir = File(tempDir, "done")
        
        assertTrue(plannedDir.exists() && plannedDir.isDirectory, "planned directory should exist")
        assertTrue(ongoingDir.exists() && ongoingDir.isDirectory, "ongoing directory should exist")
        assertTrue(doneDir.exists() && doneDir.isDirectory, "done directory should exist")
    }
    
    @Test
    fun `detects file creation in planned directory`() = runBlocking {
        fileWatchService.start()
        
        // Start collecting events first
        val eventJob = async {
            fileWatchService.events.first()
        }
        
        // Give watch service time to start and begin listening
        delay(200)
        
        val file = File(tempDir, "planned/test-task.md")
        file.writeAndSync("# Test Task")
        
        // Allow more time for file system events in CI environments
        val event = withTimeout(5000) {
            eventJob.await()
        }
        
        assertTrue(event is FileChangeEvent.Created, "Should receive Created event")
        assertEquals("test-task.md", event.file.name)
        assertEquals(TaskStatus.PLANNED, event.status)
    }
    
    @Test
    fun `detects file modification`() = runBlocking {
        fileWatchService.start()
        
        // Give watch service time to start
        delay(200)
        
        // Create file first
        val file = File(tempDir, "planned/task.md")
        file.writeAndSync("# Original Content")
        
        // Consume the creation event with longer timeout
        val creationEvent = withTimeout(5000) {
            fileWatchService.events.first()
        }
        assertTrue(creationEvent is FileChangeEvent.Created)
        
        // Wait between operations for file system to settle
        delay(500)
        
        // Collect events into a list to avoid missing them
        val eventsCollected = mutableListOf<FileChangeEvent>()
        val collectorJob = launch {
            fileWatchService.events.collect { eventsCollected.add(it) }
        }
        
        // Give collector time to start
        delay(300)
        
        // Modify file
        file.writeAndSync("# Modified Content")
        
        // Wait for event with polling
        withTimeout(5000) {
            while (eventsCollected.isEmpty()) {
                delay(100)
            }
        }
        
        collectorJob.cancel()
        
        val event = eventsCollected.first()
        assertTrue(event is FileChangeEvent.Modified, "Should receive Modified event, got: $event")
        assertEquals("task.md", event.file.name)
        assertEquals(TaskStatus.PLANNED, event.status)
    }
    
    @Test
    fun `detects file deletion`() = runBlocking {
        fileWatchService.start()
        
        // Give watch service time to start
        delay(200)
        
        // Create file
        val file = File(tempDir, "ongoing/task-to-delete.md")
        file.writeAndSync("# Task")
        
        // Consume the creation event with longer timeout
        val creationEvent = withTimeout(5000) {
            fileWatchService.events.first()
        }
        assertTrue(creationEvent is FileChangeEvent.Created)
        
        // Wait between operations for file system to settle
        delay(500)
        
        // Collect events into a list to avoid missing them
        val eventsCollected = mutableListOf<FileChangeEvent>()
        val collectorJob = launch {
            fileWatchService.events.collect { eventsCollected.add(it) }
        }
        
        // Give collector time to start
        delay(300)
        
        // Delete file
        file.delete()
        
        // Wait for event with polling
        withTimeout(5000) {
            while (eventsCollected.isEmpty()) {
                delay(100)
            }
        }
        
        collectorJob.cancel()
        
        val event = eventsCollected.first()
        assertTrue(event is FileChangeEvent.Deleted, "Should receive Deleted event, got: $event")
        assertEquals("task-to-delete.md", event.file.name)
        assertEquals(TaskStatus.ONGOING, event.status)
    }
    
    @Test
    fun `ignores non-markdown files`() = runBlocking {
        fileWatchService.start()
        
        val eventsJob = async {
            withTimeoutOrNull(2000) {
                fileWatchService.events.first()
            }
        }
        
        delay(200)
        
        File(tempDir, "planned/readme.txt").writeAndSync("Not a task")
        delay(200)
        File(tempDir, "planned/config.json").writeAndSync("{}")
        
        delay(500)
        
        val event = eventsJob.await()
        assertNull(event, "Should not emit events for non-.md files")
    }
    
    @Test
    fun `detects multiple file changes`() = runBlocking {
        fileWatchService.start()
        
        // Give watch service time to start
        delay(300)
        
        // Collect events into a list to avoid missing them
        val eventsCollected = mutableListOf<FileChangeEvent>()
        val collectorJob = launch {
            fileWatchService.events.collect { eventsCollected.add(it) }
        }
        
        // Give collector time to start
        delay(300)
        
        // Create files with delays between operations for CI environments
        File(tempDir, "planned/task1.md").writeAndSync("# Task 1")
        delay(200)
        File(tempDir, "ongoing/task2.md").writeAndSync("# Task 2")
        delay(200)
        File(tempDir, "done/task3.md").writeAndSync("# Task 3")
        
        // Wait for all 3 events with polling
        withTimeout(8000) {
            while (eventsCollected.size < 3) {
                delay(100)
            }
        }
        
        collectorJob.cancel()
        
        assertEquals(3, eventsCollected.size, "Should receive 3 events")
        
        val createdEvents = eventsCollected.filterIsInstance<FileChangeEvent.Created>()
        assertEquals(3, createdEvents.size, "All should be Created events")
        
        val statuses = createdEvents.map { it.status }.toSet()
        assertEquals(setOf(TaskStatus.PLANNED, TaskStatus.ONGOING, TaskStatus.DONE), statuses)
    }
    
    @Test
    fun `can be started and stopped`() = runBlocking {
        assertFalse(fileWatchService.isRunning(), "Should not be running initially")
        
        fileWatchService.start()
        delay(200)
        assertTrue(fileWatchService.isRunning(), "Should be running after start")
        
        fileWatchService.stop()
        delay(200)
        assertFalse(fileWatchService.isRunning(), "Should not be running after stop")
    }
}
