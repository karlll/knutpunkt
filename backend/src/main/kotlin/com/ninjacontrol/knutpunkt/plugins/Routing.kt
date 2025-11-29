package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.routes.taskRoutes
import io.ktor.server.application.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        route("/api/v1") {
            taskRoutes()
        }
    }
}
