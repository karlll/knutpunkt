package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.AppConfig
import com.ninjacontrol.knutpunkt.models.SettingsResponse
import com.ninjacontrol.knutpunkt.models.UpdateSettingRequest
import com.ninjacontrol.knutpunkt.plugins.configureSerialization
import com.ninjacontrol.knutpunkt.services.SettingsService
import com.ninjacontrol.knutpunkt.services.StateService
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.json.Json
import io.ktor.server.routing.*
import io.ktor.server.testing.*
import java.io.File
import java.nio.file.Files
import kotlin.test.*

class SettingsRoutesTest {

    private lateinit var tempDir: File
    private lateinit var stateService: StateService
    private lateinit var settingsService: SettingsService

    @BeforeTest
    fun setup() {
        tempDir = Files.createTempDirectory("settings-routes-test").toFile()
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
    fun `GET settings returns 200 with title`() = testApplication {
        application {
            configureSerialization()
            routing {
                route("/api/v1") {
                    settingsRoutes(settingsService)
                }
            }
        }

        val response = client.get("/api/v1/settings")
        assertEquals(HttpStatusCode.OK, response.status)

        val json = Json { ignoreUnknownKeys = true }
        val settingsResponse = json.decodeFromString<SettingsResponse>(response.bodyAsText())
        val titleSetting = settingsResponse.settings.find { it.key == "title" }
        assertNotNull(titleSetting)
        assertEquals("Knutpunkt", titleSetting.value)
    }

    @Test
    fun `PUT settings with title updates successfully`() = testApplication {
        application {
            configureSerialization()
            routing {
                route("/api/v1") {
                    settingsRoutes(settingsService)
                }
            }
        }

        val json = Json { ignoreUnknownKeys = true }
        val updateRequest = UpdateSettingRequest(key = "title", value = "My Project")
        val response = client.put("/api/v1/settings") {
            contentType(ContentType.Application.Json)
            setBody(json.encodeToString(UpdateSettingRequest.serializer(), updateRequest))
        }

        assertEquals(HttpStatusCode.OK, response.status)

        // Verify title was updated
        assertEquals("My Project", stateService.getTitle())

        // Verify GET returns updated value
        val getResponse = client.get("/api/v1/settings")
        val settingsResponse = json.decodeFromString<SettingsResponse>(getResponse.bodyAsText())
        val titleSetting = settingsResponse.settings.find { it.key == "title" }
        assertEquals("My Project", titleSetting?.value)
    }

    @Test
    fun `PUT settings with invalid key returns 400`() = testApplication {
        application {
            configureSerialization()
            routing {
                route("/api/v1") {
                    settingsRoutes(settingsService)
                }
            }
        }

        val json = Json { ignoreUnknownKeys = true }
        val updateRequest = UpdateSettingRequest(key = "invalid_key", value = "some value")
        val response = client.put("/api/v1/settings") {
            contentType(ContentType.Application.Json)
            setBody(json.encodeToString(UpdateSettingRequest.serializer(), updateRequest))
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
    }

    @Test
    fun `PUT settings with read-only key returns 400`() = testApplication {
        application {
            configureSerialization()
            routing {
                route("/api/v1") {
                    settingsRoutes(settingsService)
                }
            }
        }

        val json = Json { ignoreUnknownKeys = true }
        val updateRequest = UpdateSettingRequest(key = "server.port", value = "9090")
        val response = client.put("/api/v1/settings") {
            contentType(ContentType.Application.Json)
            setBody(json.encodeToString(UpdateSettingRequest.serializer(), updateRequest))
        }

        assertEquals(HttpStatusCode.BadRequest, response.status)
    }
}
