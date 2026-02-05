package com.ninjacontrol.knutpunkt.plugins

import com.ninjacontrol.knutpunkt.routes.eventRoutes
import com.ninjacontrol.knutpunkt.routes.settingsRoutes
import com.ninjacontrol.knutpunkt.routes.taskRoutes
import com.ninjacontrol.knutpunkt.routes.terminalRoutes
import com.ninjacontrol.knutpunkt.routes.versionRoutes
import com.ninjacontrol.knutpunkt.services.SettingsService
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
    // Read configuration
    val config = HoconApplicationConfig(ConfigFactory.load())

    // Terminal configuration
    val terminalEnabled = config.propertyOrNull("knutpunkt.terminal.enabled")
        ?.getString()?.toBoolean() ?: false
    val idleTimeoutMinutes = config.propertyOrNull("knutpunkt.terminal.idleTimeoutMinutes")
        ?.getString()?.toLongOrNull() ?: 30L
    val outputBufferSize = config.propertyOrNull("knutpunkt.terminal.outputBufferSize")
        ?.getString()?.toIntOrNull() ?: 100

    // SSE configuration
    val keepaliveIntervalSeconds = config.propertyOrNull("knutpunkt.sse.keepaliveIntervalSeconds")
        ?.getString()?.toLongOrNull() ?: 15L

    // Create settings service
    val settingsService = SettingsService(taskService.stateService)

    routing {
        route("/api/v1") {
            taskRoutes(taskService)
            eventRoutes(eventServices.taskEventService, eventServices.fileEventService, keepaliveIntervalSeconds)
            settingsRoutes(settingsService)
            versionRoutes()

            if (terminalEnabled) {
                val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
                val terminalService = TerminalService(
                    tasksDirectory = tasksDirectory,
                    scope = scope,
                    idleTimeoutMinutes = idleTimeoutMinutes,
                    outputBufferSize = outputBufferSize
                )

                monitor.subscribe(ApplicationStopping) {
                    terminalService.close()
                }

                terminalRoutes(terminalService)
                log.info("Terminal support enabled (idleTimeout=${idleTimeoutMinutes}min, bufferSize=${outputBufferSize})")
            } else {
                log.info("Terminal support disabled")
            }
        }
    }
}
