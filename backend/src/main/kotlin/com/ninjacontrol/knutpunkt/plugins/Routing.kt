package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.routes.eventRoutes
import com.ninjacontrol.knutpunkt.routes.taskRoutes
import com.ninjacontrol.knutpunkt.services.EventService
import com.ninjacontrol.knutpunkt.services.TaskService
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureRouting(taskService: TaskService, eventService: EventService) {
    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            eventRoutes(eventService)
        }
    }
}
