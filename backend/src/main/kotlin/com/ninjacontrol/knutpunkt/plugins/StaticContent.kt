package com.ninjacontrol.knutpunkt.plugins

import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*

fun Application.configureStaticContent() {
    routing {
        // Serve static files from resources/static directory
        // This serves all files under src/main/resources/static/
        // at the root path, including subdirectories like /assets/
        staticResources("/", "static") {
            default("index.html")
        }
    }
}
