package com.ninjacontrol.knutpunkt

import com.ninjacontrol.knutpunkt.plugins.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

// Global variable to store tasks directory from command line
var tasksDirectoryOverride: String? = null

fun main(args: Array<String>) {
    // Parse command line arguments
    if (args.isNotEmpty()) {
        tasksDirectoryOverride = args[0]
        println("Using tasks directory from command line argument: $tasksDirectoryOverride")
    }
    
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    configureSerialization()
    configureCORS()
    configureStatusPages()
    configureRouting()  // API routes first
    configureStaticContent()  // Then static/SPA fallback
}
