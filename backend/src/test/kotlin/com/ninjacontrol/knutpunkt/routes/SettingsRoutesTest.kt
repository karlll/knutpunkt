package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.models.SettingsResponse
import com.ninjacontrol.knutpunkt.services.SettingsService
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.routing.*
import io.ktor.server.testing.*
import kotlinx.serialization.json.Json
import kotlin.test.*

class SettingsRoutesTest {
    
    @Test
    fun `GET settings returns 200 with valid JSON response`() = testApplication {
        application {
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = true
                    isLenient = true
                    ignoreUnknownKeys = true
                })
            }
            routing {
                route("/api/v1") {
                    settingsRoutes(SettingsService())
                }
            }
        }
        
        val response = client.get("/api/v1/settings")
        
        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals(ContentType.Application.Json, response.contentType()?.withoutParameters())
        
        val body = response.bodyAsText()
        assertTrue(body.contains("\"settings\""))
        assertTrue(body.contains("\"key\""))
        assertTrue(body.contains("\"value\""))
    }
    
    @Test
    fun `GET settings returns all expected keys in JSON`() = testApplication {
        application {
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = true
                    isLenient = true
                    ignoreUnknownKeys = true
                })
            }
            routing {
                route("/api/v1") {
                    settingsRoutes(SettingsService())
                }
            }
        }
        
        val response = client.get("/api/v1/settings")
        val body = response.bodyAsText()
        
        // Verify expected keys are in the JSON response
        assertTrue(body.contains("server.port"))
        assertTrue(body.contains("server.host"))
        assertTrue(body.contains("tasks.directory"))
        assertTrue(body.contains("tasks.cacheEnabled"))
        assertTrue(body.contains("terminal.enabled"))
        assertTrue(body.contains("terminal.idleTimeoutMinutes"))
    }
    
    @Test
    fun `GET settings returns descriptions in JSON`() = testApplication {
        application {
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = true
                    isLenient = true
                    ignoreUnknownKeys = true
                })
            }
            routing {
                route("/api/v1") {
                    settingsRoutes(SettingsService())
                }
            }
        }
        
        val response = client.get("/api/v1/settings")
        val body = response.bodyAsText()
        
        // Verify descriptions are included
        assertTrue(body.contains("\"description\""))
        assertTrue(body.contains("Server port"))
        assertTrue(body.contains("PTY terminal support enabled"))
    }
}
