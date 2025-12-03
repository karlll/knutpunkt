package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.models.*
import com.ninjacontrol.knutpunkt.services.TaskService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.taskRoutes(taskService: TaskService) {
    
    route("/tasks") {
        get {
            val status = call.request.queryParameters["status"]?.let { 
                TaskStatus.valueOf(it.uppercase()) 
            }
            val assignee = call.request.queryParameters["assignee"]
            val category = call.request.queryParameters["category"]
            val priority = call.request.queryParameters["priority"]?.let { 
                TaskPriority.valueOf(it.uppercase()) 
            }
            
            val tasks = taskService.listTasks(status, assignee, category, priority)
            call.respond(HttpStatusCode.OK, tasks)
        }
        
        post {
            val taskCreate = call.receive<TaskCreate>()
            val task = taskService.createTask(taskCreate)
            call.respond(HttpStatusCode.Created, task)
        }
        
        route("/{id}") {
            get {
                val id = call.parameters["id"] 
                    ?: return@get call.respond(HttpStatusCode.BadRequest, Error("Missing task id"))
                
                val task = taskService.getTask(id)
                call.respond(HttpStatusCode.OK, task)
            }
            
            put {
                val id = call.parameters["id"] 
                    ?: return@put call.respond(HttpStatusCode.BadRequest, Error("Missing task id"))
                
                val taskUpdate = call.receive<TaskUpdate>()
                val task = taskService.updateTask(id, taskUpdate)
                call.respond(HttpStatusCode.OK, task)
            }
            
            delete {
                val id = call.parameters["id"] 
                    ?: return@delete call.respond(HttpStatusCode.BadRequest, Error("Missing task id"))
                
                taskService.deleteTask(id)
                call.respond(HttpStatusCode.NoContent)
            }
            
            patch("/status") {
                val id = call.parameters["id"] 
                    ?: return@patch call.respond(HttpStatusCode.BadRequest, Error("Missing task id"))
                
                val statusUpdate = call.receive<TaskStatusUpdate>()
                val task = taskService.updateTaskStatus(id, statusUpdate)
                call.respond(HttpStatusCode.OK, task)
            }
            
            patch("/order") {
                val id = call.parameters["id"] 
                    ?: return@patch call.respond(HttpStatusCode.BadRequest, Error("Missing task id"))
                
                val orderUpdate = call.receive<TaskOrderUpdate>()
                val updatedTasks = taskService.updateTaskOrder(id, orderUpdate)
                call.respond(HttpStatusCode.OK, TaskOrderResponse(updated = updatedTasks))
            }
        }
    }
}
