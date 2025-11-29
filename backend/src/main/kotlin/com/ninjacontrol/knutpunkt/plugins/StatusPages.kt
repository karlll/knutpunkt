package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.models.Error
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<TaskNotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                Error(message = cause.message ?: "Task not found", code = "TASK_NOT_FOUND")
            )
        }
        
        exception<TaskValidationException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                Error(message = cause.message ?: "Invalid task data", code = "VALIDATION_ERROR")
            )
        }
        
        exception<TaskConflictException> { call, cause ->
            call.respond(
                HttpStatusCode.Conflict,
                Error(message = cause.message ?: "Task conflict", code = "CONFLICT")
            )
        }
        
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                Error(message = "Internal server error", code = "INTERNAL_ERROR")
            )
        }
    }
}

class TaskNotFoundException(message: String) : Exception(message)
class TaskValidationException(message: String) : Exception(message)
class TaskConflictException(message: String) : Exception(message)
