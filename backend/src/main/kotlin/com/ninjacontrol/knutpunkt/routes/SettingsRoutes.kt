package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.services.SettingsService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.settingsRoutes(settingsService: SettingsService) {
    get("/settings") {
        val settings = settingsService.getSettings()
        call.respond(HttpStatusCode.OK, settings)
    }
}
