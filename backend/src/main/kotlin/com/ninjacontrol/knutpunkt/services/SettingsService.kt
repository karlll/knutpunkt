package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.AppConfig
import com.ninjacontrol.knutpunkt.models.Setting
import com.ninjacontrol.knutpunkt.models.SettingsResponse

class SettingsService(
    private val stateService: StateService,
    private val config: AppConfig
) {
    fun getSettings(): SettingsResponse {
        val settings = listOf(
            Setting(
                key = "title",
                value = getTitle(),
                description = "Application title"
            ),
            Setting(
                key = "server.port",
                value = config.port.toString(),
                description = "Server port"
            ),
            Setting(
                key = "server.host",
                value = config.host,
                description = "Server host"
            ),
            Setting(
                key = "tasks.directory",
                value = config.tasksDirectory,
                description = "Tasks storage directory"
            ),
            Setting(
                key = "tasks.cacheEnabled",
                value = config.enableCache.toString(),
                description = "Task caching enabled"
            ),
            Setting(
                key = "terminal.enabled",
                value = config.terminalEnabled.toString(),
                description = "PTY terminal support enabled"
            ),
            Setting(
                key = "terminal.idleTimeoutMinutes",
                value = config.terminalIdleTimeoutMinutes.toString(),
                description = "Terminal idle timeout in minutes"
            ),
            Setting(
                key = "terminal.outputBufferSize",
                value = config.terminalOutputBufferSize.toString(),
                description = "Terminal output buffer size"
            ),
            Setting(
                key = "sse.keepaliveIntervalSeconds",
                value = config.sseKeepaliveIntervalSeconds.toString(),
                description = "SSE heartbeat interval in seconds"
            ),
            Setting(
                key = "project.path",
                value = stateService.getProjectPath() ?: "",
                description = "Path to the project directory"
            )
        )

        return SettingsResponse(settings)
    }

    private fun getTitle(): String {
        // Precedence: state.json (runtime override) > CLI/config title
        return stateService.getTitle()
            ?: config.title
    }

    fun updateTitle(newTitle: String) {
        stateService.setTitle(newTitle)
    }
}
