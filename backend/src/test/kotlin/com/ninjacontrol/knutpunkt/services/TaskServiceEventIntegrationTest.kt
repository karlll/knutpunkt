package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

/**
 * Integration test that verifies TaskService operations don't cause duplicate events
 * from filesystem watching. This tests the deduplication logic.
 */
class TaskServiceEventIntegrationTest {
    
    @TempDir
    lateinit var tempTasksDir: File
    
    private lateinit var testScope: CoroutineScope
    private lateinit var fileWatchService: FileWatchService
    private lateinit var eventService: EventService
    private lateinit var taskService: TaskService
    
    @BeforeEach
    fun setup() {
        // Create status directories
        File(tempTasksDir, "planned").mkdirs()
        File(tempTasksDir, "ongoing").mkdirs()
        File(tempTasksDir, "done").mkdirs()
        
        // Set up the full stack
        testScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        fileWatchService = FileWatchService(tempTasksDir.absolutePath, testScope)
        eventService = EventService(fileWatchService, tempTasksDir.absolutePath, testScope, moveDetectionWindowMs = 500)
        taskService = TaskService(tempTasksDir.absolutePath, enableCache = false)
        
        // Wire them together
        taskService.setEventEmitter(eventService)
        fileWatchService.start()
    }
    
    @AfterEach
    fun cleanup() {
        eventService.close()
        fileWatchService.close()
        testScope.cancel()
    }
    
    @Test
    fun `createTask via API emits only one event despite filesystem watching`() = runBlocking {
        val events = mutableListOf<TaskEvent>()
        val job = launch(Dispatchers.IO) {
            eventService.events.collect { events.add(it) }
        }
        
        delay(200) // Let collector start
        
        // Create task via API
        val task = taskService.createTask(
            TaskCreate(
                title = "Integration Test Task",
                description = "Testing deduplication",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        // Wait for both TaskService event and potential filesystem event
        delay(2000)
        
        job.cancel()
        
        // Should have exactly ONE event (from TaskService, filesystem event deduplicated)
        assertEquals(1, events.size, "Should emit exactly one event, got: $events")
        
        val event = events[0]
        assertIs<TaskEvent.TaskCreated>(event)
        assertEquals(task.id, event.taskId)
        assertEquals(TaskStatus.PLANNED, event.status)
    }
    
    @Test
    fun `updateTaskStatus via API emits only one event despite filesystem watching`() = runBlocking {
        // Create initial task
        val task = taskService.createTask(
            TaskCreate(
                title = "Task to Move",
                description = "Will be moved",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        delay(1000) // Let initial creation settle
        
        val events = mutableListOf<TaskEvent>()
        val job = launch(Dispatchers.IO) {
            eventService.events.collect { events.add(it) }
        }
        
        delay(200)
        
        // Move task via API (this causes file to move from planned/ to ongoing/)
        taskService.updateTaskStatus(task.id, TaskStatusUpdate(TaskStatus.ONGOING))
        
        // Wait for both TaskService event and potential filesystem events
        delay(2000)
        
        job.cancel()
        
        // Should have exactly ONE event (from TaskService)
        // Filesystem will see DELETE (planned) + CREATE (ongoing) but should be deduplicated
        assertEquals(1, events.size, "Should emit exactly one event for status change, got: $events")
        
        val event = events[0]
        assertIs<TaskEvent.TaskModified>(event, "Event should be TaskModified, not TaskCreated")
        assertEquals(task.id, event.taskId)
        assertEquals(TaskStatus.ONGOING, event.status)
    }
    
    @Test
    fun `updateTaskOrder with status change emits only one event`() = runBlocking {
        // Create task in planned
        val task = taskService.createTask(
            TaskCreate(
                title = "Task for Reorder",
                description = "Will be reordered",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        delay(1000)
        
        val events = mutableListOf<TaskEvent>()
        val job = launch(Dispatchers.IO) {
            eventService.events.collect { events.add(it) }
        }
        
        delay(200)
        
        // Move to done via drag-and-drop (updateTaskOrder)
        taskService.updateTaskOrder(
            task.id,
            TaskOrderUpdate(
                newOrder = 1,
                newStatus = TaskStatus.DONE
            )
        )
        
        // Wait for events
        delay(2000)
        
        job.cancel()
        
        // Should have exactly ONE event
        assertEquals(1, events.size, "Should emit exactly one event, got: $events")
        
        val event = events[0]
        assertIs<TaskEvent.TaskModified>(event, "Event should be TaskModified")
        assertEquals(task.id, event.taskId)
        assertEquals(TaskStatus.DONE, event.status)
    }
    
    @Test
    fun `deleteTask via API emits only one event`() = runBlocking {
        // Create task
        val task = taskService.createTask(
            TaskCreate(
                title = "Task to Delete",
                description = "Will be deleted",
                status = TaskStatus.DONE,
                priority = TaskPriority.LOW,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        delay(1000)
        
        val events = mutableListOf<TaskEvent>()
        val job = launch(Dispatchers.IO) {
            eventService.events.collect { events.add(it) }
        }
        
        delay(200)
        
        // Delete task
        taskService.deleteTask(task.id)
        
        // Wait for both TaskService event and potential filesystem event
        delay(3000) // Need to wait for move detection window (500ms) + buffer
        
        job.cancel()
        
        // Should have exactly ONE event
        assertEquals(1, events.size, "Should emit exactly one event, got: $events")
        
        val event = events[0]
        assertIs<TaskEvent.TaskDeleted>(event)
        assertEquals(task.id, event.taskId)
    }
    
    @Test
    fun `manual file edit emits event when not from TaskService`() = runBlocking {
        // Create task via API first
        val task = taskService.createTask(
            TaskCreate(
                title = "Task for Manual Edit",
                description = "Original description",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        delay(6000) // Wait for dedup window to expire (5 seconds)
        
        val events = mutableListOf<TaskEvent>()
        val job = launch(Dispatchers.IO) {
            eventService.events.collect { events.add(it) }
        }
        
        delay(200)
        
        // Manually edit the file (simulating external change)
        val taskFile = File(tempTasksDir, "planned/${task.id.take(8)}.md") 
        // Find the actual file
        val actualFile = File(tempTasksDir, "planned").listFiles()?.firstOrNull { 
            it.name.endsWith(".md") 
        }
        
        if (actualFile != null) {
            // Modify the file
            val content = actualFile.readText()
            actualFile.writeText(content.replace("Original description", "Manually edited description"))
            
            // Wait for filesystem event
            delay(1000)
        }
        
        job.cancel()
        
        // Should have ONE event from filesystem (since TaskService didn't touch it)
        assertTrue(events.size >= 1, "Should emit at least one event for manual edit")
        
        val modifyEvent = events.firstOrNull { it is TaskEvent.TaskModified }
        assertIs<TaskEvent.TaskModified>(modifyEvent, "Should emit task.modified for manual edit")
    }
    
    @Test
    fun `rapid API operations emit correct sequence without duplicates`() = runBlocking {
        val events = mutableListOf<TaskEvent>()
        val job = launch(Dispatchers.IO) {
            eventService.events.collect { events.add(it) }
        }
        
        delay(200)
        
        // Create
        val task = taskService.createTask(
            TaskCreate(
                title = "Rapid Task",
                description = "Fast ops",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.HIGH,
                assignees = listOf(),
                categories = listOf()
            )
        )
        delay(100)
        
        // Move to ongoing
        taskService.updateTaskStatus(task.id, TaskStatusUpdate(TaskStatus.ONGOING))
        delay(100)
        
        // Move to done
        taskService.updateTaskStatus(task.id, TaskStatusUpdate(TaskStatus.DONE))
        delay(100)
        
        // Delete
        taskService.deleteTask(task.id)
        
        // Wait for all events including filesystem
        delay(4000)
        
        job.cancel()
        
        // Should have exactly 4 events (one per operation), no duplicates from filesystem
        assertEquals(4, events.size, "Should emit exactly 4 events, got: $events")
        
        assertIs<TaskEvent.TaskCreated>(events[0])
        assertIs<TaskEvent.TaskModified>(events[1])
        assertIs<TaskEvent.TaskModified>(events[2])
        assertIs<TaskEvent.TaskDeleted>(events[3])
        
        // Verify no duplicate events
        val eventTypes = events.map { it.eventType }
        val taskIds = events.map { it.taskId }.distinct()
        assertEquals(1, taskIds.size, "All events should be for the same task")
        assertEquals(task.id, taskIds[0])
    }
}
