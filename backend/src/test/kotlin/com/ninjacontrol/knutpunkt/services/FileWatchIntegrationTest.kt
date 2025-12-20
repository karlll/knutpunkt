package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.TaskCreate
import com.ninjacontrol.knutpunkt.models.TaskPriority
import com.ninjacontrol.knutpunkt.models.TaskStatus
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.condition.DisabledIfEnvironmentVariable
import java.io.File
import java.nio.file.Files

class FileWatchIntegrationTest {
    
    private lateinit var tempDir: File
    private lateinit var taskService: TaskService
    private lateinit var fileWatchService: FileWatchService
    private lateinit var testScope: CoroutineScope
    
    @BeforeEach
    fun setup() {
        tempDir = Files.createTempDirectory("file-watch-integration-test").toFile()
        testScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
        taskService = TaskService(tempDir.absolutePath, enableCache = true)
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
    fun `cache invalidation on external file creation`() = runBlocking {
        fileWatchService.start()
        
        taskService.createTask(TaskCreate(
            title = "Task 1",
            description = "First task",
            status = TaskStatus.PLANNED
        ))
        
        val tasks1 = taskService.listTasks()
        assertEquals(1, tasks1.size)
        
        val eventJob = async {
            fileWatchService.events.first()
        }
        
        delay(100)
        
        val externalFile = File(tempDir, "ongoing/external-task.md")
        externalFile.writeText("""
            |---
            |id: "external-id-123"
            |number: 999
            |title: "External Task"
            |createdAt: "2025-01-15T10:00:00Z"
            |updatedAt: "2025-01-15T10:00:00Z"
            |assignees: []
            |categories: []
            |priority: "medium"
            |order: 1
            |---
            |
            |# External Task
            |
            |Created externally
        """.trimMargin())
        
        val event = withTimeout(2000) {
            eventJob.await()
        }
        
        assertTrue(event is FileChangeEvent.Created)
        
        taskService.invalidateCache()
        
        val tasks2 = taskService.listTasks()
        assertEquals(2, tasks2.size)
        
        val externalTask = tasks2.find { it.id == "external-id-123" }
        assertNotNull(externalTask)
        assertEquals("External Task", externalTask!!.title)
        assertEquals(TaskStatus.ONGOING, externalTask.status)
    }
    
    @Test
    @DisabledIfEnvironmentVariable(named = "CI", matches = "true", disabledReason = "WatchService MODIFY events unreliable in CI containers")
    fun `cache invalidation on external file modification`() = runBlocking {
        fileWatchService.start()
        
        delay(100) // Give watch service time to start
        
        // Create task through service
        val task = taskService.createTask(TaskCreate(
            title = "Original Title",
            description = "Original description",
            status = TaskStatus.PLANNED
        ))
        
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
        
        val taskFile = File(tempDir, "planned/original-title.md")
        val content = taskFile.readText()
        val modifiedContent = content.replace("Original Title", "Modified Title")
        taskFile.writeText(modifiedContent)
        
        val event = withTimeout(2000) {
            modificationEventJob.await()
        }
        
        assertTrue(event is FileChangeEvent.Modified)
        
        taskService.invalidateCache()
        
        val updatedTask = taskService.getTask(task.id)
        assertEquals("Modified Title", updatedTask.title)
    }
    
    @Test
    fun `automatic cache invalidation flow`() = runBlocking {
        fileWatchService.start()
        
        delay(100) // Give watch service time to start
        
        val invalidationJob = launch {
            fileWatchService.events.collect { event ->
                when (event) {
                    is FileChangeEvent.Created,
                    is FileChangeEvent.Modified,
                    is FileChangeEvent.Deleted -> {
                        taskService.invalidateCache()
                    }
                }
            }
        }
        
        delay(100)
        
        taskService.createTask(TaskCreate(
            title = "Initial Task",
            description = "First",
            status = TaskStatus.PLANNED
        ))
        
        delay(300) // Wait for creation and invalidation
        
        assertEquals(1, taskService.listTasks().size)
        
        delay(200)
        
        val externalFile = File(tempDir, "done/completed-externally.md")
        externalFile.writeText("""
            |---
            |id: "ext-complete-123"
            |number: 888
            |title: "Completed Task"
            |createdAt: "2025-01-15T10:00:00Z"
            |updatedAt: "2025-01-15T10:00:00Z"
            |assignees: []
            |categories: []
            |priority: "high"
            |order: 1
            |---
            |
            |Done externally
        """.trimMargin())
        
        delay(800) // Wait for file watch and cache invalidation
        
        val tasks = taskService.listTasks()
        assertEquals(2, tasks.size, "Expected 2 tasks after external file creation")
        
        val completedTask = tasks.find { it.id == "ext-complete-123" }
        assertNotNull(completedTask, "External task should be found")
        assertEquals(TaskStatus.DONE, completedTask!!.status)
        assertEquals(TaskPriority.HIGH, completedTask.priority)
        
        invalidationJob.cancel()
    }
}
