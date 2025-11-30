package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.*
import com.ninjacontrol.knutpunkt.plugins.TaskConflictException
import com.ninjacontrol.knutpunkt.plugins.TaskNotFoundException
import com.ninjacontrol.knutpunkt.plugins.TaskValidationException
import com.ninjacontrol.knutpunkt.utils.MarkdownParser
import com.ninjacontrol.knutpunkt.utils.SlugGenerator
import com.ninjacontrol.knutpunkt.utils.TaskFrontMatter
import org.slf4j.LoggerFactory
import java.io.File
import java.time.Instant
import java.util.*

class TaskService(private val tasksDirectory: String = getTasksDirectory()) {
    
    private val logger = LoggerFactory.getLogger(TaskService::class.java)
    
    private val baseDir = File(tasksDirectory).apply {
        if (!exists()) {
            mkdirs()
            logger.debug("Created tasks directory: $absolutePath")
        }
        logger.info("Using tasks directory: $absolutePath")
    }
    
    private fun getStatusDir(status: TaskStatus): File {
        val dirName = when (status) {
            TaskStatus.PLANNED -> "planned"
            TaskStatus.ONGOING -> "ongoing"
            TaskStatus.DONE -> "done"
        }
        return File(baseDir, dirName).apply {
            if (!exists()) mkdirs()
        }
    }
    
    private fun findTaskFile(taskId: String): Pair<File, TaskStatus>? {
        for (status in TaskStatus.values()) {
            val dir = getStatusDir(status)
            val files = dir.listFiles { file -> file.extension == "md" } ?: continue
            
            for (file in files) {
                try {
                    val (frontMatter, _) = MarkdownParser.parseTaskFile(file)
                    if (frontMatter.id == taskId) {
                        return file to status
                    }
                } catch (e: Exception) {
                    // Skip invalid files
                    continue
                }
            }
        }
        return null
    }
    
    private fun taskFromFile(file: File, status: TaskStatus): Task {
        val (frontMatter, description) = MarkdownParser.parseTaskFile(file)
        return Task(
            id = frontMatter.id,
            title = frontMatter.title,
            description = description,
            status = status,
            createdAt = frontMatter.createdAt,
            updatedAt = frontMatter.updatedAt,
            assignees = frontMatter.assignees,
            categories = frontMatter.categories,
            priority = TaskPriority.valueOf(frontMatter.priority.uppercase()),
            order = frontMatter.order
        )
    }
    
    fun listTasks(
        status: TaskStatus? = null,
        assignee: String? = null,
        category: String? = null,
        priority: TaskPriority? = null
    ): List<Task> {
        val tasks = mutableListOf<Task>()
        
        val statusesToCheck = status?.let { listOf(it) } ?: TaskStatus.values().toList()
        
        for (taskStatus in statusesToCheck) {
            val dir = getStatusDir(taskStatus)
            val files = dir.listFiles { file -> file.extension == "md" } ?: continue
            
            for (file in files) {
                try {
                    val task = taskFromFile(file, taskStatus)
                    
                    // Apply filters
                    if (assignee != null && !task.assignees.contains(assignee)) continue
                    if (category != null && !task.categories.contains(category)) continue
                    if (priority != null && task.priority != priority) continue
                    
                    tasks.add(task)
                } catch (e: Exception) {
                    // Skip invalid files
                    continue
                }
            }
        }
        
        return tasks.sortedBy { it.order }
    }
    
    fun getTask(id: String): Task {
        val (file, status) = findTaskFile(id) 
            ?: throw TaskNotFoundException("Task with id $id not found")
        return taskFromFile(file, status)
    }
    
    fun createTask(taskCreate: TaskCreate): Task {
        logger.debug("Creating task: title='{}', status={}", taskCreate.title, taskCreate.status)
        
        if (taskCreate.title.isBlank()) {
            logger.warn("Task creation failed: blank title")
            throw TaskValidationException("Task title cannot be blank")
        }
        
        val taskId = UUID.randomUUID().toString()
        val now = Instant.now().toString()
        val slug = SlugGenerator.generateSlug(taskCreate.title)
        val status = taskCreate.status ?: TaskStatus.PLANNED
        
        val statusDir = getStatusDir(status)
        val file = File(statusDir, "$slug.md")
        
        // Check for duplicate slug
        if (file.exists()) {
            logger.warn("Task creation failed: duplicate slug '{}' in status {}", slug, status)
            throw TaskConflictException("A task with similar title already exists in $status column")
        }
        
        // Determine order: use provided value or append to end
        val order = taskCreate.order ?: run {
            val existingTasks = listTasks(status = status)
            (existingTasks.maxOfOrNull { it.order } ?: 0) + 1
        }
        
        logger.debug("Task '{}': assigned id={}, slug={}, order={}", taskCreate.title, taskId, slug, order)
        
        val frontMatter = TaskFrontMatter(
            id = taskId,
            title = taskCreate.title,
            createdAt = now,
            updatedAt = now,
            assignees = taskCreate.assignees ?: emptyList(),
            categories = taskCreate.categories ?: emptyList(),
            priority = (taskCreate.priority ?: TaskPriority.MEDIUM).toString().lowercase(),
            order = order
        )
        
        MarkdownParser.writeTaskFile(file, frontMatter, taskCreate.description)
        logger.info("Created task: id={}, title='{}', status={}, order={}, file={}", 
            taskId, taskCreate.title, status, order, file.name)
        
        // Return the created task directly instead of re-parsing
        return Task(
            id = taskId,
            title = taskCreate.title,
            description = taskCreate.description,
            status = status,
            createdAt = now,
            updatedAt = now,
            assignees = taskCreate.assignees ?: emptyList(),
            categories = taskCreate.categories ?: emptyList(),
            priority = taskCreate.priority ?: TaskPriority.MEDIUM,
            order = order
        )
    }
    
    fun updateTask(id: String, taskUpdate: TaskUpdate): Task {
        logger.debug("Updating task: id={}, title='{}'", id, taskUpdate.title)
        
        if (taskUpdate.title.isBlank()) {
            logger.warn("Task update failed: blank title for id={}", id)
            throw TaskValidationException("Task title cannot be blank")
        }
        
        val (oldFile, currentStatus) = findTaskFile(id)
            ?: throw TaskNotFoundException("Task with id $id not found").also {
                logger.warn("Task update failed: task id={} not found", id)
            }
        
        val (oldFrontMatter, _) = MarkdownParser.parseTaskFile(oldFile)
        val newStatus = taskUpdate.status ?: currentStatus
        val now = Instant.now().toString()
        
        val newSlug = SlugGenerator.generateSlug(taskUpdate.title)
        val newStatusDir = getStatusDir(newStatus)
        val newFile = File(newStatusDir, "$newSlug.md")
        
        // Check for duplicate slug (unless it's the same file)
        if (newFile.exists() && newFile.canonicalPath != oldFile.canonicalPath) {
            logger.warn("Task update failed: duplicate slug '{}' for id={}", newSlug, id)
            throw TaskConflictException("A task with similar title already exists in $newStatus column")
        }
        
        val order = taskUpdate.order ?: oldFrontMatter.order
        val statusChanged = currentStatus != newStatus
        val titleChanged = oldFrontMatter.title != taskUpdate.title
        
        logger.debug("Task {}: oldStatus={}, newStatus={}, oldTitle='{}', newTitle='{}', order={}", 
            id, currentStatus, newStatus, oldFrontMatter.title, taskUpdate.title, order)
        
        val frontMatter = TaskFrontMatter(
            id = id,
            title = taskUpdate.title,
            createdAt = oldFrontMatter.createdAt,
            updatedAt = now,
            assignees = taskUpdate.assignees ?: emptyList(),
            categories = taskUpdate.categories ?: emptyList(),
            priority = (taskUpdate.priority ?: TaskPriority.MEDIUM).toString().lowercase(),
            order = order
        )
        
        MarkdownParser.writeTaskFile(newFile, frontMatter, taskUpdate.description)
        
        // Delete old file if location changed
        if (oldFile.canonicalPath != newFile.canonicalPath) {
            oldFile.delete()
            logger.debug("Task {}: moved file from {} to {}", id, oldFile.name, newFile.name)
        }
        
        logger.info("Updated task: id={}, title='{}', status={} (changed={}), order={}", 
            id, taskUpdate.title, newStatus, statusChanged, order)
        
        // Return the updated task directly
        return Task(
            id = id,
            title = taskUpdate.title,
            description = taskUpdate.description,
            status = newStatus,
            createdAt = oldFrontMatter.createdAt,
            updatedAt = now,
            assignees = taskUpdate.assignees ?: emptyList(),
            categories = taskUpdate.categories ?: emptyList(),
            priority = taskUpdate.priority ?: TaskPriority.MEDIUM,
            order = order
        )
    }
    
    fun updateTaskStatus(id: String, statusUpdate: TaskStatusUpdate): Task {
        val (oldFile, currentStatus) = findTaskFile(id)
            ?: throw TaskNotFoundException("Task with id $id not found")
        
        val newStatus = statusUpdate.status
        
        // If status hasn't changed, just return current task
        if (currentStatus == newStatus) {
            return taskFromFile(oldFile, currentStatus)
        }
        
        val (frontMatter, description) = MarkdownParser.parseTaskFile(oldFile)
        val now = Instant.now().toString()
        
        val newStatusDir = getStatusDir(newStatus)
        val newFile = File(newStatusDir, oldFile.name)
        
        // Check for duplicate slug in new location
        if (newFile.exists()) {
            throw TaskConflictException("A task with the same name already exists in $newStatus column")
        }
        
        val updatedFrontMatter = frontMatter.copy(updatedAt = now)
        MarkdownParser.writeTaskFile(newFile, updatedFrontMatter, description)
        
        oldFile.delete()
        
        return taskFromFile(newFile, newStatus)
    }
    
    fun deleteTask(id: String) {
        logger.debug("Deleting task: id={}", id)
        
        val (file, status) = findTaskFile(id)
            ?: throw TaskNotFoundException("Task with id $id not found").also {
                logger.warn("Task deletion failed: task id={} not found", id)
            }
        
        val (frontMatter, _) = MarkdownParser.parseTaskFile(file)
        file.delete()
        
        logger.info("Deleted task: id={}, title='{}', status={}, file={}", 
            id, frontMatter.title, status, file.name)
    }
    
    fun updateTaskOrder(id: String, orderUpdate: TaskOrderUpdate): List<Task> {
        logger.debug("Updating task order: id={}, newOrder={}, newStatus={}", 
            id, orderUpdate.newOrder, orderUpdate.newStatus)
        
        val (oldFile, currentStatus) = findTaskFile(id)
            ?: throw TaskNotFoundException("Task with id $id not found").also {
                logger.warn("Task order update failed: task id={} not found", id)
            }
        
        if (orderUpdate.newOrder < 1) {
            logger.warn("Task order update failed: invalid order={} for id={}", orderUpdate.newOrder, id)
            throw TaskValidationException("Order must be >= 1")
        }
        
        val (frontMatter, description) = MarkdownParser.parseTaskFile(oldFile)
        val targetStatus = orderUpdate.newStatus ?: currentStatus
        val now = Instant.now().toString()
        val statusChanged = currentStatus != targetStatus
        
        logger.debug("Task {}: currentStatus={}, targetStatus={}, currentOrder={}, newOrder={}", 
            id, currentStatus, targetStatus, frontMatter.order, orderUpdate.newOrder)
        
        // Get all tasks in target status
        val tasksInTargetStatus = listTasks(status = targetStatus).toMutableList()
        
        // Remove the task being moved if it's in the same column
        val taskToMove = tasksInTargetStatus.find { it.id == id }
        if (taskToMove != null) {
            tasksInTargetStatus.remove(taskToMove)
        }
        
        // Insert at new position (converting from 1-based to 0-based index)
        val insertIndex = (orderUpdate.newOrder - 1).coerceIn(0, tasksInTargetStatus.size)
        
        logger.debug("Task {}: insertIndex={}, tasksInColumn={}", id, insertIndex, tasksInTargetStatus.size)
        
        // Reorder: assign sequential order values
        val updatedTasks = mutableListOf<Task>()
        var currentOrder = 1
        
        for (i in tasksInTargetStatus.indices) {
            if (i == insertIndex) {
                // Insert the moved task here
                val movedTask = Task(
                    id = id,
                    title = frontMatter.title,
                    description = description,
                    status = targetStatus,
                    createdAt = frontMatter.createdAt,
                    updatedAt = now,
                    assignees = frontMatter.assignees,
                    categories = frontMatter.categories,
                    priority = TaskPriority.valueOf(frontMatter.priority.uppercase()),
                    order = currentOrder
                )
                updatedTasks.add(movedTask)
                currentOrder++
            }
            
            val task = tasksInTargetStatus[i]
            if (task.order != currentOrder) {
                // Update order if changed
                val updatedTask = task.copy(order = currentOrder, updatedAt = now)
                updatedTasks.add(updatedTask)
            }
            currentOrder++
        }
        
        // If inserting at the end
        if (insertIndex >= tasksInTargetStatus.size) {
            val movedTask = Task(
                id = id,
                title = frontMatter.title,
                description = description,
                status = targetStatus,
                createdAt = frontMatter.createdAt,
                updatedAt = now,
                assignees = frontMatter.assignees,
                categories = frontMatter.categories,
                priority = TaskPriority.valueOf(frontMatter.priority.uppercase()),
                order = currentOrder
            )
            updatedTasks.add(movedTask)
        }
        
        // Persist all changes
        for (task in updatedTasks) {
            val (existingFile, _) = findTaskFile(task.id) ?: continue
            val (existingFrontMatter, existingDescription) = MarkdownParser.parseTaskFile(existingFile)
            
            val statusDir = getStatusDir(task.status)
            val slug = SlugGenerator.generateSlug(task.title)
            val newFile = File(statusDir, "$slug.md")
            
            val updatedFrontMatter = existingFrontMatter.copy(
                order = task.order,
                updatedAt = task.updatedAt
            )
            
            MarkdownParser.writeTaskFile(newFile, updatedFrontMatter, existingDescription)
            
            // Delete old file if moved to different column
            if (existingFile.canonicalPath != newFile.canonicalPath) {
                existingFile.delete()
            }
        }
        
        logger.info("Updated task order: id={}, title='{}', status={} (changed={}), newOrder={}, affectedTasks={}", 
            id, frontMatter.title, targetStatus, statusChanged, orderUpdate.newOrder, updatedTasks.size)
        
        if (logger.isDebugEnabled) {
            updatedTasks.forEach { task ->
                logger.debug("  - Task {}: title='{}', order={}", task.id, task.title, task.order)
            }
        }
        
        return updatedTasks
    }
}

// Helper function to determine tasks directory with precedence:
// 1. Command line argument (highest)
// 2. Environment variable
// 3. Default ./tasks (lowest)
private fun getTasksDirectory(): String {
    return com.ninjacontrol.knutpunkt.tasksDirectoryOverride
        ?: System.getenv("TASKS_DIRECTORY")
        ?: "./tasks"
}
