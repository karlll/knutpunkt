package com.ninjacontrol.knutpunkt.services

import com.ninjacontrol.knutpunkt.AppConfig
import java.io.File
import java.nio.file.Files
import kotlin.test.*

class SettingsServiceTest {

    private lateinit var tempDir: File
    private lateinit var stateService: StateService
    private lateinit var settingsService: SettingsService

    @BeforeTest
    fun setup() {
        tempDir = Files.createTempDirectory("settings-service-test").toFile()
        stateService = StateService(tempDir.absolutePath)
        val config = AppConfig(
            tasksDirectory = tempDir.absolutePath,
            port = 8080,
            host = "0.0.0.0",
            title = "Knutpunkt",
            enableCache = true,
            terminalEnabled = false,
            terminalIdleTimeoutMinutes = 30,
            terminalOutputBufferSize = 100,
            sseKeepaliveIntervalSeconds = 15
        )
        settingsService = SettingsService(stateService, config)
    }

    @AfterTest
    fun cleanup() {
        tempDir.deleteRecursively()
    }

    @Test
    fun `getSettings returns title setting`() {
        val response = settingsService.getSettings()
        val titleSetting = response.settings.find { it.key == "title" }

        assertNotNull(titleSetting, "Title setting should be present")
        assertEquals("title", titleSetting.key)
        assertEquals("Knutpunkt", titleSetting.value, "Default title should be Knutpunkt")
        assertEquals("Application title", titleSetting.description)
    }

    @Test
    fun `getSettings returns title from state when set`() {
        stateService.setTitle("My Custom Project")

        val response = settingsService.getSettings()
        val titleSetting = response.settings.find { it.key == "title" }

        assertNotNull(titleSetting)
        assertEquals("My Custom Project", titleSetting.value, "Should use title from state")
    }

    @Test
    fun `updateTitle updates state`() {
        settingsService.updateTitle("New Project Name")

        assertEquals("New Project Name", stateService.getTitle())
    }

    @Test
    fun `getSettings includes all expected settings`() {
        val response = settingsService.getSettings()

        // Check that title is the first setting
        assertEquals("title", response.settings[0].key)

        // Check that other settings are present
        val keys = response.settings.map { it.key }
        assertTrue(keys.contains("server.port"), "Should include server.port")
        assertTrue(keys.contains("server.host"), "Should include server.host")
        assertTrue(keys.contains("tasks.directory"), "Should include tasks.directory")
    }
}
