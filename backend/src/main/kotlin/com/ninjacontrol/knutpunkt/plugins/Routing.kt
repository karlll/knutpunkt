package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.routes.eventRoutes
import com.ninjacontrol.knutpunkt.routes.taskRoutes
import com.ninjacontrol.knutpunkt.routes.terminalRoutes
import com.ninjacontrol.knutpunkt.services.TaskService
import com.ninjacontrol.knutpunkt.services.TerminalService
import io.ktor.server.application.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

fun Application.configureRouting(taskService: TaskService, eventServices: EventServices, tasksDirectory: String) {
    val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    val terminalService = TerminalService(tasksDirectory, scope)
    
    // Clean up on application shutdown
    environment.monitor.subscribe(ApplicationStopping) {
        terminalService.close()
    }
    
    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            eventRoutes(eventServices.taskEventService, eventServices.fileEventService)
            terminalRoutes(terminalService)
        }
    }
}
