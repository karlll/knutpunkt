package com.ninjacontrol.knutpunkt

import com.ninjacontrol.knutpunkt.plugins.*
import com.ninjacontrol.knutpunkt.services.TaskService
import com.typesafe.config.ConfigFactory
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

// Global variable to store tasks directory from command line
var tasksDirectoryOverride: String? = null

fun main(args: Array<String>) {
    // Support external config file via system property
    val configFile = System.getProperty("config.file")
    if (configFile != null) {
        println("Loading external configuration from: $configFile")
    }
    
    // Parse command line arguments for tasks directory override
    if (args.isNotEmpty()) {
        tasksDirectoryOverride = args[0]
        println("Using tasks directory from command line argument: $tasksDirectoryOverride")
    }
    
    // Load configuration (external file takes precedence if provided)
    val config = ConfigFactory.load()
    val hoconConfig = HoconApplicationConfig(config)
    
    // Read server configuration
    val port = hoconConfig.property("ktor.deployment.port").getString().toInt()
    val host = hoconConfig.property("ktor.deployment.host").getString()
    
    println("Starting Knutpunkt server on $host:$port")
    
    embeddedServer(
        Netty,
        port = port,
        host = host,
        module = Application::module
    ).start(wait = true)
}

fun Application.module() {
    // Load configuration (will use external config if -Dconfig.file is set)
    val config = ConfigFactory.load()
    val appConfig = HoconApplicationConfig(config)
    
    // Determine tasks directory (precedence: CLI arg > env var > config file > default)
    val tasksDirectory = tasksDirectoryOverride
        ?: System.getenv("TASKS_DIRECTORY")
        ?: appConfig.propertyOrNull("knutpunkt.tasks.directory")?.getString()
        ?: "./tasks"
    
    // Read cache setting from config
    val enableCache = appConfig.propertyOrNull("knutpunkt.tasks.enableCache")
        ?.getString()?.toBoolean() ?: true
    
    println("Tasks directory: $tasksDirectory")
    println("Cache enabled: $enableCache")
    
    // Create shared TaskService instance
    val taskService = TaskService(tasksDirectory, enableCache = enableCache)
    
    configureSerialization()
    configureSSE()
    configureWebSockets()
    configureCORS()
    configureStatusPages()
    val eventServices = configureFileWatch(taskService, tasksDirectory)  // Initialize file watching and events
    configureRouting(taskService, eventServices, tasksDirectory)  // API routes first
    configureStaticContent()  // Then static/SPA fallback
}
