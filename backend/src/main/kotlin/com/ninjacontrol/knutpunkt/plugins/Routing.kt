package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.routes.eventRoutes
import com.ninjacontrol.knutpunkt.routes.taskRoutes
import com.ninjacontrol.knutpunkt.routes.terminalRoutes
import com.ninjacontrol.knutpunkt.services.TaskService
import com.ninjacontrol.knutpunkt.services.TerminalService
import com.typesafe.config.ConfigFactory
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

fun Application.configureRouting(taskService: TaskService, eventServices: EventServices, tasksDirectory: String) {
    // Read terminal configuration
    val config = HoconApplicationConfig(ConfigFactory.load())
    val terminalEnabled = config.propertyOrNull("knutpunkt.terminal.enabled")
        ?.getString()?.toBoolean() ?: true
    
    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            eventRoutes(eventServices.taskEventService, eventServices.fileEventService)
            
            if (terminalEnabled) {
                val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
                val terminalService = TerminalService(tasksDirectory, scope)
                
                environment.monitor.subscribe(ApplicationStopping) {
                    terminalService.close()
                }
                
                terminalRoutes(terminalService)
                log.info("Terminal support enabled")
            } else {
                log.info("Terminal support disabled")
            }
        }
    }
}
