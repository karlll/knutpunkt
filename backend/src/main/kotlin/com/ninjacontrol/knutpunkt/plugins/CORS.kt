package com.ninjacontrol.knutpunkt.plugins

import com.typesafe.config.ConfigFactory
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.config.*
import io.ktor.server.plugins.cors.routing.*

fun Application.configureCORS() {
    // Load configuration
    val config = HoconApplicationConfig(ConfigFactory.load())
    
    // Read allowed hosts from config
    val allowedHosts = try {
        config.property("knutpunkt.cors.allowedHosts").getList()
    } catch (e: Exception) {
        listOf("127.0.0.1:5173")
    }
    
    // Read allow credentials from config
    val allowCredentialsValue = try {
        config.property("knutpunkt.cors.allowCredentials").getString().toBoolean()
    } catch (e: Exception) {
        true
    }
    
    install(CORS) {
        allowedHosts.forEach { host ->
            allowHost(host)
        }
        
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Options)
        
        allowCredentials = allowCredentialsValue
    }
}
