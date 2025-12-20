package com.ninjacontrol.knutpunkt.routes

import com.ninjacontrol.knutpunkt.models.Version
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.jar.Manifest

fun Route.versionRoutes() {
    get("/version") {
        val version = extractVersionFromManifest()
        call.respond(HttpStatusCode.OK, version)
    }
}

private fun extractVersionFromManifest(): Version {
    return try {
        // Find the manifest for this application
        val manifest = Application::class.java.classLoader
            .getResources("META-INF/MANIFEST.MF")
            .asSequence()
            .map { it.openStream().use { stream -> Manifest(stream) } }
            .firstOrNull { it.mainAttributes.getValue("Implementation-Title") == "Knutpunkt" }

        if (manifest != null) {
            Version(
                version = manifest.mainAttributes.getValue("Implementation-Version") ?: "unknown",
                buildTimestamp = manifest.mainAttributes.getValue("Build-Timestamp") ?: "unknown",
                gitCommit = manifest.mainAttributes.getValue("Git-Commit") ?: "unknown",
                builtBy = manifest.mainAttributes.getValue("Built-By") ?: "unknown"
            )
        } else {
            // Development fallback
            Version(
                version = "dev",
                buildTimestamp = "unknown",
                gitCommit = "unknown",
                builtBy = System.getProperty("user.name") ?: "unknown"
            )
        }
    } catch (e: Exception) {
        // Fallback in case of any errors
        Version(
            version = "unknown",
            buildTimestamp = "unknown",
            gitCommit = "unknown",
            builtBy = "unknown"
        )
    }
}
