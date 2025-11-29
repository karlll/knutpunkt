package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.*
import com.ninjacontrol.knutpunkt.plugins.TaskConflictException
import com.ninjacontrol.knutpunkt.plugins.TaskNotFoundException
import com.ninjacontrol.knutpunkt.plugins.TaskValidationException
import com.ninjacontrol.knutpunkt.utils.MarkdownParser
import com.ninjacontrol.knutpunkt.utils.SlugGenerator
import com.ninjacontrol.knutpunkt.utils.TaskFrontMatter
import java.io.File
import java.time.Instant
import java.util.*

class TaskService(private val tasksDirectory: String = "../tasks") {
    
    private val baseDir = File(tasksDirectory).apply {
        if (!exists()) mkdirs()
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
            priority = TaskPriority.valueOf(frontMatter.priority.uppercase())
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
        
        return tasks
    }
    
    fun getTask(id: String): Task {
        val (file, status) = findTaskFile(id) 
            ?: throw TaskNotFoundException("Task with id $id not found")
        return taskFromFile(file, status)
    }
    
    fun createTask(taskCreate: TaskCreate): Task {
        if (taskCreate.title.isBlank()) {
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
            throw TaskConflictException("A task with similar title already exists in $status column")
        }
        
        val frontMatter = TaskFrontMatter(
            id = taskId,
            title = taskCreate.title,
            createdAt = now,
            updatedAt = now,
            assignees = taskCreate.assignees ?: emptyList(),
            categories = taskCreate.categories ?: emptyList(),
            priority = (taskCreate.priority ?: TaskPriority.MEDIUM).toString().lowercase()
        )
        
        MarkdownParser.writeTaskFile(file, frontMatter, taskCreate.description)
        
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
            priority = taskCreate.priority ?: TaskPriority.MEDIUM
        )
    }
    
    fun updateTask(id: String, taskUpdate: TaskUpdate): Task {
        if (taskUpdate.title.isBlank()) {
            throw TaskValidationException("Task title cannot be blank")
        }
        
        val (oldFile, currentStatus) = findTaskFile(id)
            ?: throw TaskNotFoundException("Task with id $id not found")
        
        val (oldFrontMatter, _) = MarkdownParser.parseTaskFile(oldFile)
        val newStatus = taskUpdate.status ?: currentStatus
        val now = Instant.now().toString()
        
        val newSlug = SlugGenerator.generateSlug(taskUpdate.title)
        val newStatusDir = getStatusDir(newStatus)
        val newFile = File(newStatusDir, "$newSlug.md")
        
        // Check for duplicate slug (unless it's the same file)
        if (newFile.exists() && newFile.canonicalPath != oldFile.canonicalPath) {
            throw TaskConflictException("A task with similar title already exists in $newStatus column")
        }
        
        val frontMatter = TaskFrontMatter(
            id = id,
            title = taskUpdate.title,
            createdAt = oldFrontMatter.createdAt,
            updatedAt = now,
            assignees = taskUpdate.assignees ?: emptyList(),
            categories = taskUpdate.categories ?: emptyList(),
            priority = (taskUpdate.priority ?: TaskPriority.MEDIUM).toString().lowercase()
        )
        
        MarkdownParser.writeTaskFile(newFile, frontMatter, taskUpdate.description)
        
        // Delete old file if location changed
        if (oldFile.canonicalPath != newFile.canonicalPath) {
            oldFile.delete()
        }
        
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
            priority = taskUpdate.priority ?: TaskPriority.MEDIUM
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
        val (file, _) = findTaskFile(id)
            ?: throw TaskNotFoundException("Task with id $id not found")
        file.delete()
    }
}
