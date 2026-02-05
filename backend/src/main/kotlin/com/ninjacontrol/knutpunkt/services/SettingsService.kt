package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.models.Setting
import com.ninjacontrol.knutpunkt.models.SettingsResponse
import com.typesafe.config.ConfigFactory
import io.ktor.server.config.*

class SettingsService(
    private val stateService: StateService
) {
    private val config = HoconApplicationConfig(ConfigFactory.load())

    fun getSettings(): SettingsResponse {
        val settings = listOf(
            Setting(
                key = "title",
                value = getTitle(),
                description = "Application title"
            ),
            Setting(
                key = "server.port",
                value = config.propertyOrNull("ktor.deployment.port")?.getString() ?: "8080",
                description = "Server port"
            ),
            Setting(
                key = "server.host",
                value = config.propertyOrNull("ktor.deployment.host")?.getString() ?: "0.0.0.0",
                description = "Server host"
            ),
            Setting(
                key = "tasks.directory",
                value = config.propertyOrNull("knutpunkt.tasks.directory")?.getString() ?: "./tasks",
                description = "Tasks storage directory"
            ),
            Setting(
                key = "tasks.cacheEnabled",
                value = (config.propertyOrNull("knutpunkt.tasks.enableCache")?.getString()?.toBoolean() ?: true).toString(),
                description = "Task caching enabled"
            ),
            Setting(
                key = "terminal.enabled",
                value = (config.propertyOrNull("knutpunkt.terminal.enabled")?.getString()?.toBoolean() ?: false).toString(),
                description = "PTY terminal support enabled"
            ),
            Setting(
                key = "terminal.idleTimeoutMinutes",
                value = config.propertyOrNull("knutpunkt.terminal.idleTimeoutMinutes")?.getString() ?: "30",
                description = "Terminal idle timeout in minutes"
            ),
            Setting(
                key = "terminal.outputBufferSize",
                value = config.propertyOrNull("knutpunkt.terminal.outputBufferSize")?.getString() ?: "100",
                description = "Terminal output buffer size"
            ),
            Setting(
                key = "sse.keepaliveIntervalSeconds",
                value = config.propertyOrNull("knutpunkt.sse.keepaliveIntervalSeconds")?.getString() ?: "15",
                description = "SSE heartbeat interval in seconds"
            )
        )

        return SettingsResponse(settings)
    }

    private fun getTitle(): String {
        // Precedence: state.json > application.conf > default
        return stateService.getTitle()
            ?: config.propertyOrNull("knutpunkt.title")?.getString()
            ?: "Knutpunkt"
    }

    fun updateTitle(newTitle: String) {
        stateService.setTitle(newTitle)
    }
}
