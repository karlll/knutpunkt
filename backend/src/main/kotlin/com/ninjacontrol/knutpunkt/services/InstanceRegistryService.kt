package com.ninjacontrol.knutpunkt.services

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.io.File
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import java.nio.charset.StandardCharsets
import java.nio.file.StandardOpenOption
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * One running Knutpunkt instance, as advertised to local clients.
 *
 * The registry is a discovery hint only — clients are expected to confirm an
 * instance by calling `GET /api/v1/settings` on it.
 */
@Serializable
data class InstanceEntry(
    val port: Int,
    val host: String,
    val projectPath: String? = null,
    val tasksDirectory: String,
    val title: String,
    val pid: Long,
    val startedAt: String
)

/**
 * Machine-wide registry of running instances, at `$KNUTPUNKT_HOME/instances.json`
 * (default `~/.knutpunkt/instances.json`).
 *
 * Unlike [StateService], which is scoped to one tasks directory, this is shared by
 * every instance on the machine: it lets a client find the board that serves a given
 * project without scanning ports. Registry updates are best-effort — a failure to
 * write is logged and ignored, since discovery works without the file.
 */
class InstanceRegistryService(
    registryFile: File? = null,
    /**
     * Whether a registered instance is still around. Entries are left behind when a
     * process is killed without running its shutdown hook, so every write prunes them.
     * Overridable so tests can simulate several live instances from one JVM.
     */
    private val isAlive: (Long) -> Boolean = ::isProcessAlive
) {

    private val logger = LoggerFactory.getLogger(InstanceRegistryService::class.java)
    private val registryFile = registryFile ?: File(knutpunktHome(), REGISTRY_FILE_NAME)
    private val json = Json { prettyPrint = true; ignoreUnknownKeys = true }

    companion object {
        const val REGISTRY_FILE_NAME = "instances.json"

        /** Honours $KNUTPUNKT_HOME so tests and alternate setups can relocate the registry. */
        fun knutpunktHome(): File =
            System.getenv("KNUTPUNKT_HOME")
                ?.takeIf { it.isNotBlank() }
                ?.let { File(it) }
                ?: File(System.getProperty("user.home"), ".knutpunkt")

        private fun isProcessAlive(pid: Long): Boolean =
            ProcessHandle.of(pid).map { it.isAlive }.orElse(false)

        /**
         * Serialises writers within this JVM. The file lock guards against other
         * processes, but [FileChannel.lock] throws for overlapping locks from the same
         * JVM instead of waiting, which would silently drop concurrent updates.
         */
        private val jvmLock = ReentrantLock()
    }

    /** Adds this instance, replacing any stale entry for the same port or pid. */
    fun register(entry: InstanceEntry) {
        update { entries ->
            entries.filterNot { it.port == entry.port || it.pid == entry.pid } + entry
        }
        logger.info("Registered instance: port=${entry.port}, project=${entry.projectPath ?: "(unset)"}")
    }

    /** Removes this instance. Safe to call when it was never registered. */
    fun deregister(pid: Long) {
        update { entries -> entries.filterNot { it.pid == pid } }
        logger.debug("Deregistered instance: pid={}", pid)
    }

    /** Live instances currently registered, with dead entries filtered out. */
    fun listInstances(): List<InstanceEntry> =
        try {
            if (!registryFile.exists()) {
                emptyList()
            } else {
                decode(registryFile.readText()).filter { isAlive(it.pid) }
            }
        } catch (e: Exception) {
            logger.warn("Failed to read instance registry: ${e.message}")
            emptyList()
        }

    /**
     * Read-modify-write under an exclusive file lock, so instances starting at the same
     * time cannot clobber each other. Dead entries are pruned on every write.
     */
    private fun update(transform: (List<InstanceEntry>) -> List<InstanceEntry>) {
        jvmLock.withLock {
            try {
                registryFile.parentFile?.mkdirs()
                FileChannel.open(
                    registryFile.toPath(),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.READ,
                    StandardOpenOption.WRITE
                ).use { channel ->
                    channel.lock().use {
                        val current = decode(readAll(channel)).filter { isAlive(it.pid) }
                        val content = json.encodeToString(transform(current))
                        channel.truncate(0)
                        channel.position(0)
                        channel.write(ByteBuffer.wrap(content.toByteArray(StandardCharsets.UTF_8)))
                    }
                }
            } catch (e: Exception) {
                // Discovery falls back to scanning ports, so this is never fatal.
                logger.warn("Failed to update instance registry at ${registryFile.absolutePath}: ${e.message}")
            }
        }
    }

    private fun readAll(channel: FileChannel): String {
        val buffer = ByteBuffer.allocate(channel.size().toInt())
        channel.position(0)
        while (buffer.hasRemaining() && channel.read(buffer) > 0) {
            // Keep reading until the buffer is filled or the channel is exhausted.
        }
        return String(buffer.array(), 0, buffer.position(), StandardCharsets.UTF_8)
    }

    /** A hand-edited or truncated registry is treated as empty rather than fatal. */
    private fun decode(content: String): List<InstanceEntry> {
        if (content.isBlank()) return emptyList()
        return try {
            json.decodeFromString<List<InstanceEntry>>(content)
        } catch (e: Exception) {
            logger.warn("Instance registry is unreadable, starting over: ${e.message}")
            emptyList()
        }
    }
}
