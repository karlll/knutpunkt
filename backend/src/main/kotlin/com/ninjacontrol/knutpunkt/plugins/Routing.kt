package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.AppConfig
import com.ninjacontrol.knutpunkt.routes.eventRoutes
import com.ninjacontrol.knutpunkt.routes.settingsRoutes
import com.ninjacontrol.knutpunkt.routes.taskRoutes
import com.ninjacontrol.knutpunkt.routes.terminalRoutes
import com.ninjacontrol.knutpunkt.routes.versionRoutes
import com.ninjacontrol.knutpunkt.services.SettingsService
import com.ninjacontrol.knutpunkt.services.TaskService
import com.ninjacontrol.knutpunkt.services.TerminalService
import io.ktor.server.application.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

fun Application.configureRouting(taskService: TaskService, eventServices: EventServices, config: AppConfig) {
    // Create settings service
    val settingsService = SettingsService(taskService.stateService, config)

    // Persist project path to state if provided via CLI
    if (config.projectPath != null) {
        taskService.stateService.setProjectPath(config.projectPath)
        log.info("Project path: ${config.projectPath}")
    }

    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            eventRoutes(eventServices.taskEventService, eventServices.fileEventService, config.sseKeepaliveIntervalSeconds)
            settingsRoutes(settingsService)
            versionRoutes()

            if (config.terminalEnabled) {
                val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
                val terminalService = TerminalService(
                    tasksDirectory = config.tasksDirectory,
                    scope = scope,
                    idleTimeoutMinutes = config.terminalIdleTimeoutMinutes,
                    outputBufferSize = config.terminalOutputBufferSize
                )

                monitor.subscribe(ApplicationStopping) {
                    terminalService.close()
                }

                terminalRoutes(terminalService)
                log.info("Terminal support enabled (idleTimeout=${config.terminalIdleTimeoutMinutes}min, bufferSize=${config.terminalOutputBufferSize})")
            } else {
                log.info("Terminal support disabled")
            }
        }
    }
}
