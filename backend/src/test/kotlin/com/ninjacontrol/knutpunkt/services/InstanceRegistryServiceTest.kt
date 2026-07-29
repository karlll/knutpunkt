package com.ninjacontrol.knutpunkt.services

import java.io.File
import java.nio.file.Files
import java.time.Instant
import kotlin.test.*

class InstanceRegistryServiceTest {

    private lateinit var tempDir: File
    private lateinit var registryFile: File
    private lateinit var registry: InstanceRegistryService

    private val livePid = ProcessHandle.current().pid()

    @BeforeTest
    fun setup() {
        tempDir = Files.createTempDirectory("instance-registry-test").toFile()
        registryFile = File(tempDir, InstanceRegistryService.REGISTRY_FILE_NAME)
        registry = InstanceRegistryService(registryFile)
    }

    @AfterTest
    fun cleanup() {
        tempDir.deleteRecursively()
    }

    private fun entry(
        port: Int,
        pid: Long = livePid,
        projectPath: String? = "/projects/foo"
    ) = InstanceEntry(
        port = port,
        host = "0.0.0.0",
        projectPath = projectPath,
        tasksDirectory = "/projects/foo/tasks",
        title = "Foo",
        pid = pid,
        startedAt = Instant.now().toString()
    )

    @Test
    fun `no registry file means no instances`() {
        assertFalse(registryFile.exists(), "Registry file should not be created by construction")
        assertEquals(emptyList(), registry.listInstances())
    }

    @Test
    fun `register makes an instance discoverable`() {
        registry.register(entry(port = 8091))

        val instances = registry.listInstances()
        assertEquals(1, instances.size)
        assertEquals(8091, instances[0].port)
        assertEquals("/projects/foo", instances[0].projectPath)
        assertEquals("Foo", instances[0].title)
    }

    @Test
    fun `register creates the parent directory`() {
        val nested = File(tempDir, "nested/dir/instances.json")
        InstanceRegistryService(nested).register(entry(port = 8091))

        assertTrue(nested.exists(), "Registry file should be created along with its directory")
    }

    @Test
    fun `several instances coexist`() {
        // Separate boards mean separate processes, so they carry distinct pids.
        val allAlive = { _: Long -> true }
        val multi = InstanceRegistryService(registryFile, allAlive)
        multi.register(entry(port = 8091, pid = 4001, projectPath = "/projects/foo"))
        multi.register(entry(port = 8092, pid = 4002, projectPath = "/projects/bar"))

        val ports = multi.listInstances().map { it.port }.sorted()
        assertEquals(listOf(8091, 8092), ports)
    }

    @Test
    fun `re-registering the same port replaces the old entry`() {
        registry.register(entry(port = 8091, projectPath = "/projects/foo"))
        registry.register(entry(port = 8091, projectPath = "/projects/renamed"))

        val instances = registry.listInstances()
        assertEquals(1, instances.size, "Same port should not appear twice")
        assertEquals("/projects/renamed", instances[0].projectPath)
    }

    @Test
    fun `deregister removes the instance`() {
        registry.register(entry(port = 8091))
        registry.deregister(livePid)

        assertEquals(emptyList(), registry.listInstances())
    }

    @Test
    fun `deregister is a no-op for an unregistered pid`() {
        registry.register(entry(port = 8091))
        registry.deregister(livePid + 1)

        assertEquals(1, registry.listInstances().size, "Other instances should be untouched")
    }

    @Test
    fun `entries for dead processes are not listed`() {
        registryFile.writeText(
            """
            [
              {
                "port": 8099,
                "host": "0.0.0.0",
                "projectPath": "/projects/gone",
                "tasksDirectory": "/projects/gone/tasks",
                "title": "Gone",
                "pid": 999999999,
                "startedAt": "2026-01-01T00:00:00Z"
              }
            ]
            """.trimIndent()
        )

        assertEquals(emptyList(), registry.listInstances(), "Dead instance should be filtered out")
    }

    @Test
    fun `entries for dead processes are pruned on write`() {
        registryFile.writeText(
            """
            [
              {
                "port": 8099,
                "host": "0.0.0.0",
                "tasksDirectory": "/projects/gone/tasks",
                "title": "Gone",
                "pid": 999999999,
                "startedAt": "2026-01-01T00:00:00Z"
              }
            ]
            """.trimIndent()
        )

        registry.register(entry(port = 8091))

        val instances = registry.listInstances()
        assertEquals(1, instances.size, "Dead entry should have been pruned")
        assertEquals(8091, instances[0].port)
        assertFalse(registryFile.readText().contains("999999999"), "Dead pid should be gone from disk")
    }

    @Test
    fun `a corrupt registry is replaced rather than failing`() {
        registryFile.writeText("{ this is not valid json")

        assertEquals(emptyList(), registry.listInstances(), "Corrupt file should read as empty")

        registry.register(entry(port = 8091))
        assertEquals(1, registry.listInstances().size, "Registration should recover the file")
    }

    @Test
    fun `an empty registry file reads as empty`() {
        registryFile.writeText("")

        assertEquals(emptyList(), registry.listInstances())
    }

    @Test
    fun `unknown fields are tolerated`() {
        registryFile.writeText(
            """
            [
              {
                "port": 8091,
                "host": "0.0.0.0",
                "tasksDirectory": "/projects/foo/tasks",
                "title": "Foo",
                "pid": $livePid,
                "startedAt": "2026-01-01T00:00:00Z",
                "somethingNewer": "ignored"
              }
            ]
            """.trimIndent()
        )

        assertEquals(1, registry.listInstances().size, "Forward-compatible fields should not break reads")
    }

    @Test
    fun `registering a second port from the same process replaces the first`() {
        // One process serves one board, so its pid identifies it as surely as its port.
        registry.register(entry(port = 8091))
        registry.register(entry(port = 8092))

        val instances = registry.listInstances()
        assertEquals(1, instances.size, "A pid should appear only once")
        assertEquals(8092, instances[0].port)
    }

    @Test
    fun `concurrent registrations do not lose entries`() {
        // Distinct pids stand in for separate instances; liveness is stubbed because a
        // single test JVM cannot produce several live pids of its own.
        val allAlive = { _: Long -> true }
        val ports = (8100..8115).toList()
        val threads = ports.map { port ->
            Thread {
                InstanceRegistryService(registryFile, allAlive)
                    .register(entry(port = port, pid = port.toLong()))
            }
        }

        threads.forEach { it.start() }
        threads.forEach { it.join() }

        val registered = InstanceRegistryService(registryFile, allAlive)
            .listInstances().map { it.port }.sorted()
        assertEquals(ports, registered, "Every concurrent registration should survive")
    }

    @Test
    fun `knutpunktHome defaults under the user home`() {
        val home = InstanceRegistryService.knutpunktHome()
        assertEquals(File(System.getProperty("user.home"), ".knutpunkt").absolutePath, home.absolutePath)
    }
}
