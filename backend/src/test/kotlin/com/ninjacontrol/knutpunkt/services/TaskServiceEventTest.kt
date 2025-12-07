package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

/**
 * Test TaskService's direct event emission.
 * These tests are deterministic and don't rely on filesystem watching.
 */
class TaskServiceEventTest {
    
    @TempDir
    lateinit var tempTasksDir: File
    
    private lateinit var taskService: TaskService
    private lateinit var mockEventEmitter: MockEventEmitter
    
    class MockEventEmitter : TaskEventEmitter {
        val events = mutableListOf<TaskEvent>()
        
        override suspend fun emit(event: TaskEvent) {
            events.add(event)
        }
        
        fun clear() {
            events.clear()
        }
    }
    
    @BeforeEach
    fun setup() {
        // Create status directories
        File(tempTasksDir, "planned").mkdirs()
        File(tempTasksDir, "ongoing").mkdirs()
        File(tempTasksDir, "done").mkdirs()
        
        taskService = TaskService(tempTasksDir.absolutePath, enableCache = false)
        mockEventEmitter = MockEventEmitter()
        taskService.setEventEmitter(mockEventEmitter)
    }
    
    @AfterEach
    fun cleanup() {
        mockEventEmitter.clear()
    }
    
    @Test
    fun `createTask emits TaskCreated event`() = runBlocking {
        // Create a task
        val taskCreate = TaskCreate(
            title = "Test Task",
            description = "Test Description",
            status = TaskStatus.PLANNED,
            priority = TaskPriority.MEDIUM,
            assignees = listOf(),
            categories = listOf()
        )
        
        val createdTask = taskService.createTask(taskCreate)
        
        // Wait a bit for async event emission
        delay(100)
        
        // Verify event was emitted
        assertEquals(1, mockEventEmitter.events.size, "Should emit exactly one event")
        
        val event = mockEventEmitter.events[0]
        assertIs<TaskEvent.TaskCreated>(event, "Event should be TaskCreated")
        assertEquals(createdTask.id, event.taskId, "Event should have correct task ID")
        assertEquals(TaskStatus.PLANNED, event.status, "Event should have correct status")
    }
    
    @Test
    fun `updateTask emits TaskModified event`() = runBlocking {
        // Create a task first
        val taskCreate = TaskCreate(
            title = "Original Title",
            description = "Original Description",
            status = TaskStatus.PLANNED,
            priority = TaskPriority.LOW,
            assignees = listOf(),
            categories = listOf()
        )
        
        val createdTask = taskService.createTask(taskCreate)
        delay(100)
        mockEventEmitter.clear() // Clear the create event
        
        // Update the task
        val taskUpdate = TaskUpdate(
            title = "Updated Title",
            description = "Updated Description",
            status = TaskStatus.PLANNED,
            priority = TaskPriority.HIGH,
            assignees = listOf("alice"),
            categories = listOf("bug")
        )
        
        taskService.updateTask(createdTask.id, taskUpdate)
        delay(100)
        
        // Verify event was emitted
        assertEquals(1, mockEventEmitter.events.size, "Should emit exactly one event")
        
        val event = mockEventEmitter.events[0]
        assertIs<TaskEvent.TaskModified>(event, "Event should be TaskModified")
        assertEquals(createdTask.id, event.taskId, "Event should have correct task ID")
        assertEquals(TaskStatus.PLANNED, event.status, "Event should have correct status")
    }
    
    @Test
    fun `updateTaskStatus emits TaskModified event`() = runBlocking {
        // Create a task in planned
        val taskCreate = TaskCreate(
            title = "Task to Move",
            description = "Description",
            status = TaskStatus.PLANNED,
            priority = TaskPriority.MEDIUM,
            assignees = listOf(),
            categories = listOf()
        )
        
        val createdTask = taskService.createTask(taskCreate)
        delay(100)
        mockEventEmitter.clear()
        
        // Move to ongoing
        val statusUpdate = TaskStatusUpdate(status = TaskStatus.ONGOING)
        taskService.updateTaskStatus(createdTask.id, statusUpdate)
        delay(100)
        
        // Verify event was emitted
        assertEquals(1, mockEventEmitter.events.size, "Should emit exactly one event")
        
        val event = mockEventEmitter.events[0]
        assertIs<TaskEvent.TaskModified>(event, "Event should be TaskModified")
        assertEquals(createdTask.id, event.taskId, "Event should have correct task ID")
        assertEquals(TaskStatus.ONGOING, event.status, "Event should reflect new status")
    }
    
    @Test
    fun `deleteTask emits TaskDeleted event`() = runBlocking {
        // Create a task
        val taskCreate = TaskCreate(
            title = "Task to Delete",
            description = "Will be deleted",
            status = TaskStatus.DONE,
            priority = TaskPriority.LOW,
            assignees = listOf(),
            categories = listOf()
        )
        
        val createdTask = taskService.createTask(taskCreate)
        delay(100)
        mockEventEmitter.clear()
        
        // Delete the task
        taskService.deleteTask(createdTask.id)
        delay(100)
        
        // Verify event was emitted
        assertEquals(1, mockEventEmitter.events.size, "Should emit exactly one event")
        
        val event = mockEventEmitter.events[0]
        assertIs<TaskEvent.TaskDeleted>(event, "Event should be TaskDeleted")
        assertEquals(createdTask.id, event.taskId, "Event should have correct task ID")
        assertEquals(TaskStatus.DONE, event.status, "Event should have original status")
    }
    
    @Test
    fun `updateTaskOrder with status change emits TaskModified event`() = runBlocking {
        // Create two tasks in planned
        val task1 = taskService.createTask(
            TaskCreate(
                title = "Task 1",
                description = "Desc 1",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        val task2 = taskService.createTask(
            TaskCreate(
                title = "Task 2",
                description = "Desc 2",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        delay(100)
        mockEventEmitter.clear()
        
        // Move task1 to ongoing column
        val orderUpdate = TaskOrderUpdate(
            newOrder = 1,
            newStatus = TaskStatus.ONGOING
        )
        
        taskService.updateTaskOrder(task1.id, orderUpdate)
        delay(100)
        
        // Verify event was emitted (status changed)
        assertEquals(1, mockEventEmitter.events.size, "Should emit exactly one event when status changes")
        
        val event = mockEventEmitter.events[0]
        assertIs<TaskEvent.TaskModified>(event, "Event should be TaskModified")
        assertEquals(task1.id, event.taskId, "Event should have correct task ID")
        assertEquals(TaskStatus.ONGOING, event.status, "Event should reflect new status")
    }
    
    @Test
    fun `updateTaskOrder without status change does not emit event`() = runBlocking {
        // Create two tasks in planned
        val task1 = taskService.createTask(
            TaskCreate(
                title = "Task A",
                description = "Desc A",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        val task2 = taskService.createTask(
            TaskCreate(
                title = "Task B",
                description = "Desc B",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.MEDIUM,
                assignees = listOf(),
                categories = listOf()
            )
        )
        
        delay(100)
        mockEventEmitter.clear()
        
        // Reorder within same column
        val orderUpdate = TaskOrderUpdate(
            newOrder = 1,
            newStatus = null // stays in planned
        )
        
        taskService.updateTaskOrder(task2.id, orderUpdate)
        delay(100)
        
        // Verify no event was emitted (just reordering, no status change)
        assertEquals(0, mockEventEmitter.events.size, "Should not emit event when only reordering within column")
    }
    
    @Test
    fun `rapid task operations emit correct sequence of events`() = runBlocking {
        // Create
        val task = taskService.createTask(
            TaskCreate(
                title = "Rapid Task",
                description = "Fast operations",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.HIGH,
                assignees = listOf(),
                categories = listOf()
            )
        )
        delay(50)
        
        // Update
        taskService.updateTask(
            task.id,
            TaskUpdate(
                title = "Rapid Task Updated",
                description = "Fast operations updated",
                status = TaskStatus.PLANNED,
                priority = TaskPriority.HIGH,
                assignees = listOf("bob"),
                categories = listOf()
            )
        )
        delay(50)
        
        // Move to ongoing
        taskService.updateTaskStatus(task.id, TaskStatusUpdate(TaskStatus.ONGOING))
        delay(50)
        
        // Move to done
        taskService.updateTaskStatus(task.id, TaskStatusUpdate(TaskStatus.DONE))
        delay(50)
        
        // Delete
        taskService.deleteTask(task.id)
        delay(50)
        
        // Verify all events
        assertEquals(5, mockEventEmitter.events.size, "Should emit 5 events")
        
        assertIs<TaskEvent.TaskCreated>(mockEventEmitter.events[0])
        assertIs<TaskEvent.TaskModified>(mockEventEmitter.events[1])
        assertIs<TaskEvent.TaskModified>(mockEventEmitter.events[2])
        assertIs<TaskEvent.TaskModified>(mockEventEmitter.events[3])
        assertIs<TaskEvent.TaskDeleted>(mockEventEmitter.events[4])
        
        // Verify statuses
        assertEquals(TaskStatus.PLANNED, mockEventEmitter.events[0].status)
        assertEquals(TaskStatus.PLANNED, mockEventEmitter.events[1].status)
        assertEquals(TaskStatus.ONGOING, mockEventEmitter.events[2].status)
        assertEquals(TaskStatus.DONE, mockEventEmitter.events[3].status)
        assertEquals(TaskStatus.DONE, mockEventEmitter.events[4].status)
    }
}
