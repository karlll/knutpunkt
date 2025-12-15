package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

/**
 * Test TaskEventService - simple event broadcasting
 */
class TaskEventServiceTest {
    
    private lateinit var testScope: CoroutineScope
    private lateinit var taskEventService: TaskEventService
    
    @BeforeEach
    fun setup() {
        testScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
        taskEventService = TaskEventService(testScope)
    }
    
    @AfterEach
    fun cleanup() {
        taskEventService.close()
        testScope.cancel()
    }
    
    @Test
    fun `emits TaskCreated event`() = runBlocking {
        val task = Task(
            id = "test-id",
            number = 1,
            title = "Test Task",
            description = "Description",
            status = TaskStatus.PLANNED,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString(),
            assignees = listOf(),
            categories = listOf(),
            priority = TaskPriority.MEDIUM,
            order = 1
        )
        
        val event = TaskEvent.TaskCreated(
            taskId = task.id,
            timestamp = Instant.now().toString(),
            clientMutationId = null,
            task = task
        )
        
        // Collect one event
        val job = async {
            taskEventService.events.take(1).toList()
        }
        
        delay(100) // Let collector start
        taskEventService.emit(event)
        
        val events = job.await()
        assertEquals(1, events.size)
        assertIs<TaskEvent.TaskCreated>(events[0])
        assertEquals(task.id, events[0].taskId)
    }
    
    @Test
    fun `emits TaskUpdated event with changes`() = runBlocking {
        val task = Task(
            id = "test-id-2",
            number = 2,
            title = "Updated Task",
            description = "Updated",
            status = TaskStatus.ONGOING,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString(),
            assignees = listOf("alice"),
            categories = listOf("feature"),
            priority = TaskPriority.HIGH,
            order = 1
        )
        
        val changes = TaskChanges(
            titleChanged = true,
            statusChanged = true
        )
        
        val event = TaskEvent.TaskUpdated(
            taskId = task.id,
            timestamp = Instant.now().toString(),
            clientMutationId = null,
            task = task,
            changes = changes
        )
        
        val job = async {
            taskEventService.events.take(1).toList()
        }
        
        delay(100)
        taskEventService.emit(event)
        
        val events = job.await()
        assertEquals(1, events.size)
        assertIs<TaskEvent.TaskUpdated>(events[0])
        assertTrue((events[0] as TaskEvent.TaskUpdated).changes.titleChanged)
        assertTrue((events[0] as TaskEvent.TaskUpdated).changes.statusChanged)
    }
    
    @Test
    fun `emits TaskDeleted event`() = runBlocking {
        val task = Task(
            id = "deleted-task",
            number = 1,
            title = "Deleted Task",
            description = "Test description",
            status = TaskStatus.DONE,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString(),
            assignees = emptyList(),
            categories = emptyList(),
            priority = TaskPriority.MEDIUM,
            order = 1
        )
        val event = TaskEvent.TaskDeleted(
            taskId = "deleted-task",
            timestamp = Instant.now().toString(),
            clientMutationId = null,
            task = task
        )

        val job = async {
            taskEventService.events.take(1).toList()
        }

        delay(100)
        taskEventService.emit(event)

        val events = job.await()
        assertEquals(1, events.size)
        assertIs<TaskEvent.TaskDeleted>(events[0])
        assertEquals("Deleted Task", (events[0] as TaskEvent.TaskDeleted).task.title)
    }
    
    @Test
    fun `multiple collectors receive same event`() = runBlocking {
        val task = Task(
            id = "shared-id",
            number = 3,
            title = "Shared Task",
            description = "Shared",
            status = TaskStatus.PLANNED,
            createdAt = Instant.now().toString(),
            updatedAt = Instant.now().toString(),
            assignees = listOf(),
            categories = listOf(),
            priority = TaskPriority.MEDIUM,
            order = 1
        )
        
        val event = TaskEvent.TaskCreated(
            taskId = task.id,
            timestamp = Instant.now().toString(),
            clientMutationId = null,
            task = task
        )
        
        // Two collectors
        val job1 = async { taskEventService.events.take(1).toList() }
        val job2 = async { taskEventService.events.take(1).toList() }
        
        delay(100)
        taskEventService.emit(event)
        
        val events1 = job1.await()
        val events2 = job2.await()
        
        assertEquals(1, events1.size, "First collector should receive event")
        assertEquals(1, events2.size, "Second collector should receive event")
        assertEquals(task.id, events1[0].taskId)
        assertEquals(task.id, events2[0].taskId)
    }
}
