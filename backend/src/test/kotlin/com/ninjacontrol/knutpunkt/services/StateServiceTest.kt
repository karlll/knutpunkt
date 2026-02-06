package com.ninjacontrol.knutpunkt.services

import kotlinx.serialization.json.Json
import java.io.File
import java.nio.file.Files
import kotlin.test.*

class StateServiceTest {
    
    private lateinit var tempDir: File
    private lateinit var stateService: StateService
    
    @BeforeTest
    fun setup() {
        tempDir = Files.createTempDirectory("state-service-test").toFile()
        stateService = StateService(tempDir.absolutePath)
    }
    
    @AfterTest
    fun cleanup() {
        tempDir.deleteRecursively()
    }
    
    @Test
    fun `state file is created on initialization`() {
        val stateFile = File(tempDir, "state.json")
        assertTrue(stateFile.exists(), "State file should be created")
        
        val content = stateFile.readText()
        val state = Json.decodeFromString<ApplicationState>(content)
        assertEquals(0, state.task_counter, "Initial counter should be 0")
    }
    
    @Test
    fun `getNextTaskNumber returns sequential numbers`() {
        val num1 = stateService.getNextTaskNumber()
        val num2 = stateService.getNextTaskNumber()
        val num3 = stateService.getNextTaskNumber()
        
        assertEquals(1, num1, "First task number should be 1")
        assertEquals(2, num2, "Second task number should be 2")
        assertEquals(3, num3, "Third task number should be 3")
    }
    
    @Test
    fun `counter persists across service instances`() {
        // First instance
        val num1 = stateService.getNextTaskNumber()
        assertEquals(1, num1)
        
        // Create new instance with same directory
        val stateService2 = StateService(tempDir.absolutePath)
        val num2 = stateService2.getNextTaskNumber()
        assertEquals(2, num2, "New instance should continue from persisted counter")
    }
    
    @Test
    fun `getCurrentCounter returns current value`() {
        assertEquals(0, stateService.getCurrentCounter())

        stateService.getNextTaskNumber()
        assertEquals(1, stateService.getCurrentCounter())

        stateService.getNextTaskNumber()
        stateService.getNextTaskNumber()
        assertEquals(3, stateService.getCurrentCounter())
    }

    @Test
    fun `getTitle returns null when not set`() {
        assertNull(stateService.getTitle(), "Title should be null initially")
    }

    @Test
    fun `setTitle stores and retrieves title`() {
        stateService.setTitle("My Project")
        assertEquals("My Project", stateService.getTitle(), "Title should be stored and retrieved")
    }

    @Test
    fun `title persists across service instances`() {
        stateService.setTitle("Test Title")

        // Create new instance with same directory
        val stateService2 = StateService(tempDir.absolutePath)
        assertEquals("Test Title", stateService2.getTitle(), "Title should persist across instances")
    }

    @Test
    fun `title and counter work independently`() {
        stateService.setTitle("Project Name")
        val num1 = stateService.getNextTaskNumber()

        assertEquals("Project Name", stateService.getTitle())
        assertEquals(1, num1)
        assertEquals(1, stateService.getCurrentCounter())
    }

    @Test
    fun `getProjectPath returns null when not set`() {
        assertNull(stateService.getProjectPath(), "Project path should be null initially")
    }

    @Test
    fun `setProjectPath stores and retrieves path`() {
        stateService.setProjectPath("/home/user/myproject")
        assertEquals("/home/user/myproject", stateService.getProjectPath())
    }

    @Test
    fun `project path persists across service instances`() {
        stateService.setProjectPath("/tmp/project")

        val stateService2 = StateService(tempDir.absolutePath)
        assertEquals("/tmp/project", stateService2.getProjectPath(), "Project path should persist across instances")
    }

    @Test
    fun `project path, title and counter work independently`() {
        stateService.setProjectPath("/tmp/project")
        stateService.setTitle("Project Name")
        val num1 = stateService.getNextTaskNumber()

        assertEquals("/tmp/project", stateService.getProjectPath())
        assertEquals("Project Name", stateService.getTitle())
        assertEquals(1, num1)
    }
}
