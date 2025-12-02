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
        
        val eventJob = async {
            fileWatchService.events.first()
        }
        
        delay(100)
        
        val file = File(tempDir, "planned/test-task.md")
        file.writeText("# Test Task")
        
        val event = withTimeout(2000) {
            eventJob.await()
        }
        
        assertTrue(event is FileChangeEvent.Created, "Should receive Created event")
        assertEquals("test-task.md", event.file.name)
        assertEquals(TaskStatus.PLANNED, event.status)
    }
    
    @Test
    fun `detects file modification`() = runBlocking {
        fileWatchService.start()
        
        delay(100) // Give watch service time to start
        
        // Create file and consume the creation event
        val file = File(tempDir, "planned/task.md")
        file.writeText("# Original Content")
        
        // Consume the creation event
        val creationEvent = withTimeout(2000) {
            fileWatchService.events.first()
        }
        assertTrue(creationEvent is FileChangeEvent.Created)
        
        delay(100)
        
        // Now listen for modification
        val modificationEventJob = async {
            fileWatchService.events.first()
        }
        
        delay(100)
        
        file.writeText("# Modified Content")
        
        val event = withTimeout(2000) {
            modificationEventJob.await()
        }
        
        assertTrue(event is FileChangeEvent.Modified)
        assertEquals("task.md", event.file.name)
        assertEquals(TaskStatus.PLANNED, event.status)
    }
    
    @Test
    fun `detects file deletion`() = runBlocking {
        fileWatchService.start()
        
        delay(100) // Give watch service time to start
        
        // Create file and consume the creation event
        val file = File(tempDir, "ongoing/task-to-delete.md")
        file.writeText("# Task")
        
        // Consume the creation event
        val creationEvent = withTimeout(2000) {
            fileWatchService.events.first()
        }
        assertTrue(creationEvent is FileChangeEvent.Created)
        
        delay(100)
        
        // Now listen for deletion
        val deletionEventJob = async {
            fileWatchService.events.first()
        }
        
        delay(100)
        
        file.delete()
        
        val event = withTimeout(2000) {
            deletionEventJob.await()
        }
        
        assertTrue(event is FileChangeEvent.Deleted)
        assertEquals("task-to-delete.md", event.file.name)
        assertEquals(TaskStatus.ONGOING, event.status)
    }
    
    @Test
    fun `ignores non-markdown files`() = runBlocking {
        fileWatchService.start()
        
        val eventsJob = async {
            withTimeoutOrNull(1000) {
                fileWatchService.events.first()
            }
        }
        
        delay(100)
        
        File(tempDir, "planned/readme.txt").writeText("Not a task")
        File(tempDir, "planned/config.json").writeText("{}")
        
        delay(500)
        
        val event = eventsJob.await()
        assertNull(event, "Should not emit events for non-.md files")
    }
    
    @Test
    fun `detects multiple file changes`() = runBlocking {
        fileWatchService.start()
        
        val eventsJob = async {
            fileWatchService.events.take(3).toList()
        }
        
        delay(100)
        
        File(tempDir, "planned/task1.md").writeText("# Task 1")
        delay(50)
        File(tempDir, "ongoing/task2.md").writeText("# Task 2")
        delay(50)
        File(tempDir, "done/task3.md").writeText("# Task 3")
        
        val events = withTimeout(3000) {
            eventsJob.await()
        }
        
        assertEquals(3, events.size, "Should receive 3 events")
        
        val createdEvents = events.filterIsInstance<FileChangeEvent.Created>()
        assertEquals(3, createdEvents.size, "All should be Created events")
        
        val statuses = createdEvents.map { it.status }.toSet()
        assertEquals(setOf(TaskStatus.PLANNED, TaskStatus.ONGOING, TaskStatus.DONE), statuses)
    }
    
    @Test
    fun `can be started and stopped`() = runBlocking {
        assertFalse(fileWatchService.isRunning(), "Should not be running initially")
        
        fileWatchService.start()
        delay(100)
        assertTrue(fileWatchService.isRunning(), "Should be running after start")
        
        fileWatchService.stop()
        delay(100)
        assertFalse(fileWatchService.isRunning(), "Should not be running after stop")
    }
}
