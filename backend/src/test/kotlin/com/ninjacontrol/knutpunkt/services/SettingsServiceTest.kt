package com.ninjacontrol.knutpunkt.services

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class SettingsServiceTest {
    
    @Test
    fun `getSettings returns all expected settings`() {
        val service = SettingsService()
        val response = service.getSettings()
        
        assertNotNull(response)
        assertNotNull(response.settings)
        assertTrue(response.settings.isNotEmpty())
        
        // Verify all expected keys are present
        val keys = response.settings.map { it.key }
        assertTrue(keys.contains("server.port"))
        assertTrue(keys.contains("server.host"))
        assertTrue(keys.contains("tasks.directory"))
        assertTrue(keys.contains("tasks.cacheEnabled"))
        assertTrue(keys.contains("terminal.enabled"))
        assertTrue(keys.contains("terminal.idleTimeoutMinutes"))
    }
    
    @Test
    fun `getSettings returns valid values`() {
        val service = SettingsService()
        val response = service.getSettings()
        
        // Check that all settings have non-empty values
        response.settings.forEach { setting ->
            assertNotNull(setting.key)
            assertNotNull(setting.value)
            assertTrue(setting.key.isNotEmpty())
            assertTrue(setting.value.isNotEmpty())
        }
    }
    
    @Test
    fun `getSettings returns terminal disabled by default`() {
        val service = SettingsService()
        val response = service.getSettings()
        
        val terminalSetting = response.settings.find { it.key == "terminal.enabled" }
        assertNotNull(terminalSetting)
        assertEquals("false", terminalSetting.value)
    }
    
    @Test
    fun `getSettings includes descriptions`() {
        val service = SettingsService()
        val response = service.getSettings()
        
        // All settings should have descriptions
        response.settings.forEach { setting ->
            assertNotNull(setting.description)
            assertTrue(setting.description!!.isNotEmpty())
        }
    }
}
