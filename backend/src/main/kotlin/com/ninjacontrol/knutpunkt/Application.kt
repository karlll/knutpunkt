package com.ninjacontrol.knutpunkt

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.core.main
import com.github.ajalt.clikt.parameters.arguments.argument
import com.github.ajalt.clikt.parameters.options.convert
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.int
import com.github.ajalt.clikt.parameters.types.long
import com.github.ajalt.clikt.parameters.types.path
import com.ninjacontrol.knutpunkt.plugins.*
import com.ninjacontrol.knutpunkt.services.TaskService
import com.typesafe.config.ConfigFactory
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import java.nio.file.Path

/**
 * Holds all resolved application configuration.
 * Values are determined by CLI arguments, falling back to HOCON config file defaults.
 */
data class AppConfig(
    val tasksDirectory: String,
    val port: Int,
    val host: String,
    val title: String,
    val enableCache: Boolean,
    val terminalEnabled: Boolean,
    val terminalIdleTimeoutMinutes: Long,
    val terminalOutputBufferSize: Int,
    val sseKeepaliveIntervalSeconds: Long,
    val configFile: Path? = null
)

// Global config set by CLI parsing, read by module()
lateinit var appConfig: AppConfig

class KnutpunktCommand : CliktCommand(name = "knutpunkt") {
    override fun help(context: com.github.ajalt.clikt.core.Context) = "Knutpunkt — Kanban task board server"

    private val configFilePath: Path? by option(
        "--config", "-c",
        help = "Path to external application.conf file"
    ).path(mustExist = true, canBeDir = false)

    private val tasksDirectory: String by argument(
        help = "Path to tasks storage directory"
    )

    private val port: Int? by option(
        "--port", "-p",
        help = "Server port"
    ).int()

    private val host: String? by option(
        "--host",
        help = "Server host"
    )

    private val title: String? by option(
        "--title",
        help = "Application title"
    )

    private val cache: Boolean? by option(
        "--cache",
        help = "Enable task caching (true/false)"
    ).convert { it.toBooleanStrict() }

    private val terminal: Boolean? by option(
        "--terminal",
        help = "Enable PTY terminal support (true/false)"
    ).convert { it.toBooleanStrict() }

    private val terminalTimeout: Long? by option(
        "--terminal-timeout",
        help = "Terminal idle timeout in minutes"
    ).long()

    private val terminalBuffer: Int? by option(
        "--terminal-buffer",
        help = "Terminal output buffer size"
    ).int()

    private val sseKeepalive: Long? by option(
        "--sse-keepalive",
        help = "SSE heartbeat interval in seconds"
    ).long()

    override fun run() {
        // Load external config file if provided (must happen before ConfigFactory.load())
        if (configFilePath != null) {
            System.setProperty("config.file", configFilePath.toString())
            println("Loading external configuration from: $configFilePath")
        }

        // Load HOCON config (includes external file if --config was provided)
        val hocon = HoconApplicationConfig(ConfigFactory.load())

        // Build resolved config: CLI option > HOCON config file > hardcoded default
        appConfig = AppConfig(
            tasksDirectory = tasksDirectory,
            port = port ?: hocon.intOrDefault("ktor.deployment.port", DEFAULT_PORT),
            host = host ?: hocon.stringOrDefault("ktor.deployment.host", DEFAULT_HOST),
            title = title ?: hocon.stringOrDefault("knutpunkt.title", DEFAULT_TITLE),
            enableCache = cache ?: hocon.booleanOrDefault("knutpunkt.tasks.enableCache", true),
            terminalEnabled = terminal ?: hocon.booleanOrDefault("knutpunkt.terminal.enabled", false),
            terminalIdleTimeoutMinutes = terminalTimeout ?: hocon.longOrDefault("knutpunkt.terminal.idleTimeoutMinutes", DEFAULT_TERMINAL_TIMEOUT),
            terminalOutputBufferSize = terminalBuffer ?: hocon.intOrDefault("knutpunkt.terminal.outputBufferSize", DEFAULT_TERMINAL_BUFFER),
            sseKeepaliveIntervalSeconds = sseKeepalive ?: hocon.longOrDefault("knutpunkt.sse.keepaliveIntervalSeconds", DEFAULT_SSE_KEEPALIVE),
            configFile = configFilePath
        )

        println("Starting Knutpunkt server on ${appConfig.host}:${appConfig.port}")
        println("Tasks directory: ${appConfig.tasksDirectory}")
        println("Cache enabled: ${appConfig.enableCache}")

        embeddedServer(
            Netty,
            port = appConfig.port,
            host = appConfig.host,
            module = Application::module
        ).start(wait = true)
    }

    companion object {
        const val DEFAULT_PORT = 8080
        const val DEFAULT_HOST = "0.0.0.0"
        const val DEFAULT_TITLE = "Knutpunkt"
        const val DEFAULT_TERMINAL_TIMEOUT = 30L
        const val DEFAULT_TERMINAL_BUFFER = 100
        const val DEFAULT_SSE_KEEPALIVE = 15L
    }
}

private fun HoconApplicationConfig.stringOrDefault(key: String, default: String): String =
    propertyOrNull(key)?.getString() ?: default

private fun HoconApplicationConfig.intOrDefault(key: String, default: Int): Int =
    propertyOrNull(key)?.getString()?.toIntOrNull() ?: default

private fun HoconApplicationConfig.longOrDefault(key: String, default: Long): Long =
    propertyOrNull(key)?.getString()?.toLongOrNull() ?: default

private fun HoconApplicationConfig.booleanOrDefault(key: String, default: Boolean): Boolean =
    propertyOrNull(key)?.getString()?.toBooleanStrictOrNull() ?: default

fun main(args: Array<String>) = KnutpunktCommand().main(args)

fun Application.module() {
    val config = appConfig

    // Create shared TaskService instance
    val taskService = TaskService(config.tasksDirectory, enableCache = config.enableCache)

    configureSerialization()
    configureSSE()
    configureWebSockets()
    configureCORS()
    configureStatusPages()
    val eventServices = configureFileWatch(taskService, config.tasksDirectory)
    configureRouting(taskService, eventServices, config)
    configureStaticContent()
}
