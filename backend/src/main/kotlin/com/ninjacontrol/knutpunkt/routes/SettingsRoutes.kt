package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.models.UpdateSettingRequest
import com.ninjacontrol.knutpunkt.services.SettingsService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.settingsRoutes(settingsService: SettingsService) {
    get("/settings") {
        val settings = settingsService.getSettings()
        call.respond(HttpStatusCode.OK, settings)
    }

    put("/settings") {
        val request = call.receive<UpdateSettingRequest>()

        when (request.key) {
            "title" -> {
                settingsService.updateTitle(request.value)
                call.respond(HttpStatusCode.OK, mapOf("message" to "Setting updated successfully"))
            }
            else -> {
                call.respond(
                    HttpStatusCode.BadRequest,
                    mapOf("error" to "Setting '${request.key}' is not writable")
                )
            }
        }
    }
}
