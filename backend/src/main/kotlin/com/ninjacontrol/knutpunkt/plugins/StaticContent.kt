package com.ninjacontrol.knutpunkt.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File

fun Application.configureStaticContent() {
    routing {
        // Serve static resources from classpath
        static("/") {
            resources("static")
        }
        
        // SPA fallback - serve index.html for routes that don't exist
        // This must be last to act as a catch-all
        get("/{...}") {
            val requestPath = call.request.local.uri
            
            // Don't intercept API routes
            if (requestPath.startsWith("/api/")) {
                return@get
            }
            
            val indexHtml = this::class.java.classLoader.getResource("static/index.html")
            if (indexHtml != null) {
                call.respondText(indexHtml.readText(), ContentType.Text.Html)
            } else {
                call.respondText("Frontend not built. Run './gradlew build' to include frontend.", ContentType.Text.Plain, HttpStatusCode.NotFound)
            }
        }
    }
}
