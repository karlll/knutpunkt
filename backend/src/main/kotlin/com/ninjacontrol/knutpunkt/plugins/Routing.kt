package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.routes.taskEventRoutes
import com.ninjacontrol.knutpunkt.routes.taskRoutes
import com.ninjacontrol.knutpunkt.services.TaskService
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureRouting(taskService: TaskService, eventServices: EventServices) {
    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            taskEventRoutes(eventServices.taskEventService)
        }
    }
}
