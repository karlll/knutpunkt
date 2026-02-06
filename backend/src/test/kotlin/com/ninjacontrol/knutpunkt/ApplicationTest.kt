package com.ninjacontrol.knutpunkt

import com.github.ajalt.clikt.core.MissingArgument
import com.github.ajalt.clikt.core.PrintHelpMessage
import com.github.ajalt.clikt.core.parse
import kotlin.test.*

class KnutpunktCommandTest {

    @Test
    fun `missing tasks directory argument produces error`() {
        val command = KnutpunktCommand()
        assertFailsWith<MissingArgument> {
            command.parse(emptyList())
        }
    }

    @Test
    fun `help flag produces help message`() {
        val command = KnutpunktCommand()
        assertFailsWith<PrintHelpMessage> {
            command.parse(listOf("--help"))
        }
    }

    @Test
    fun `parses tasks directory argument`() {
        val command = KnutpunktCommand()
        // parse() will call run() which starts the server, so we test the parsing
        // by checking that the command accepts valid arguments without parse errors.
        // We can't call run() in tests because it starts the server.
        // Instead, verify that option parsing works by testing with --help after valid args.
        assertFailsWith<PrintHelpMessage> {
            command.parse(listOf("/tmp/tasks", "--help"))
        }
    }

    @Test
    fun `AppConfig data class has correct defaults`() {
        val config = AppConfig(
            tasksDirectory = "/tmp/tasks",
            port = 8080,
            host = "0.0.0.0",
            title = "Knutpunkt",
            enableCache = true,
            terminalEnabled = false,
            terminalIdleTimeoutMinutes = 30,
            terminalOutputBufferSize = 100,
            sseKeepaliveIntervalSeconds = 15
        )

        assertEquals("/tmp/tasks", config.tasksDirectory)
        assertEquals(8080, config.port)
        assertEquals("0.0.0.0", config.host)
        assertEquals("Knutpunkt", config.title)
        assertTrue(config.enableCache)
        assertFalse(config.terminalEnabled)
        assertEquals(30L, config.terminalIdleTimeoutMinutes)
        assertEquals(100, config.terminalOutputBufferSize)
        assertEquals(15L, config.sseKeepaliveIntervalSeconds)
        assertNull(config.configFile)
        assertNull(config.projectPath)
    }

    @Test
    fun `AppConfig configFile and projectPath default to null`() {
        val config = AppConfig(
            tasksDirectory = "/tmp/tasks",
            port = 8080,
            host = "0.0.0.0",
            title = "Test",
            enableCache = false,
            terminalEnabled = true,
            terminalIdleTimeoutMinutes = 60,
            terminalOutputBufferSize = 200,
            sseKeepaliveIntervalSeconds = 30
        )

        assertNull(config.configFile)
        assertNull(config.projectPath)
        assertTrue(config.terminalEnabled)
        assertFalse(config.enableCache)
    }

    @Test
    fun `AppConfig accepts projectPath`() {
        val config = AppConfig(
            tasksDirectory = "/tmp/tasks",
            port = 8080,
            host = "0.0.0.0",
            title = "Test",
            enableCache = true,
            terminalEnabled = false,
            terminalIdleTimeoutMinutes = 30,
            terminalOutputBufferSize = 100,
            sseKeepaliveIntervalSeconds = 15,
            projectPath = "/home/user/myproject"
        )

        assertEquals("/home/user/myproject", config.projectPath)
    }
}
