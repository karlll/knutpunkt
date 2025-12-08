package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskStatus
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File
import kotlin.test.assertEquals
import kotlin.test.assertIs

/**
 * Test FileEventService - converts FileWatchService events to FileEvents
 */
class FileEventServiceTest {
    
    @TempDir
    lateinit var tempTasksDir: File
    
    private lateinit var testScope: CoroutineScope
    private lateinit var fileWatchService: FileWatchService
    private lateinit var fileEventService: FileEventService
    
    @BeforeEach
    fun setup() {
        // Create status directories
        File(tempTasksDir, "planned").mkdirs()
        File(tempTasksDir, "ongoing").mkdirs()
        File(tempTasksDir, "done").mkdirs()
        
        testScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        fileWatchService = FileWatchService(tempTasksDir.absolutePath, testScope)
        fileEventService = FileEventService(fileWatchService, testScope)
        
        fileWatchService.start()
    }
    
    @AfterEach
    fun cleanup() {
        fileEventService.close()
        fileWatchService.close()
        testScope.cancel()
    }
    
    @Test
    fun `emits FileCreated event when file is created`() = runBlocking {
        val job = async {
            fileEventService.events.take(1).toList()
        }
        
        delay(500) // Let collectors start
        
        // Create a file
        val testFile = File(tempTasksDir, "planned/test-task.md")
        testFile.writeText("---\nid: test\n---\nTest")
        
        val events = withTimeout(3000) { job.await() }
        
        assertEquals(1, events.size, "Should emit one event")
        assertIs<com.ninjacontrol.knutpunkt.models.FileEvent.FileCreated>(events[0])
        assertEquals("planned", (events[0] as com.ninjacontrol.knutpunkt.models.FileEvent.FileCreated).directory)
    }
    
    @Test
    fun `emits FileModified event when file is modified`() = runBlocking {
        // Create a file first
        val testFile = File(tempTasksDir, "ongoing/existing-task.md")
        testFile.writeText("---\nid: existing\n---\nOriginal")
        delay(1000) // Wait for file system to settle
        
        val job = async {
            fileEventService.events.take(1).toList()
        }
        
        delay(500)
        
        // Modify the file
        testFile.writeText("---\nid: existing\n---\nModified")
        
        val events = withTimeout(3000) { job.await() }
        
        assertEquals(1, events.size, "Should emit one event")
        assertIs<com.ninjacontrol.knutpunkt.models.FileEvent.FileModified>(events[0])
    }
    
    @Test
    fun `emits FileDeleted event when file is deleted`() = runBlocking {
        // Create a file first
        val testFile = File(tempTasksDir, "done/to-delete.md")
        testFile.writeText("---\nid: delete-me\n---\nWill be deleted")
        delay(1000)
        
        val job = async {
            fileEventService.events.take(1).toList()
        }
        
        delay(500)
        
        // Delete the file
        testFile.delete()
        
        val events = withTimeout(3000) { job.await() }
        
        assertEquals(1, events.size, "Should emit one event")
        assertIs<com.ninjacontrol.knutpunkt.models.FileEvent.FileDeleted>(events[0])
        assertEquals("done", (events[0] as com.ninjacontrol.knutpunkt.models.FileEvent.FileDeleted).directory)
    }
    
    @Test
    fun `multiple collectors receive same file events`() = runBlocking {
        val job1 = async { fileEventService.events.take(1).toList() }
        val job2 = async { fileEventService.events.take(1).toList() }
        
        delay(500)
        
        // Create a file
        val testFile = File(tempTasksDir, "planned/shared-event.md")
        testFile.writeText("---\nid: shared\n---\nShared")
        
        val events1 = withTimeout(3000) { job1.await() }
        val events2 = withTimeout(3000) { job2.await() }
        
        assertEquals(1, events1.size, "First collector should receive event")
        assertEquals(1, events2.size, "Second collector should receive event")
        assertIs<com.ninjacontrol.knutpunkt.models.FileEvent.FileCreated>(events1[0])
        assertIs<com.ninjacontrol.knutpunkt.models.FileEvent.FileCreated>(events2[0])
    }
}
