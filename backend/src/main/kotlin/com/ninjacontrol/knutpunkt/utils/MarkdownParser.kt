package com.ninjacontrol.knutpunkt.utils

import com.charleskorn.kaml.Yaml
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import java.io.File

@Serializable
data class TaskFrontMatter(
    val id: String,
    val title: String,
    val createdAt: String,
    val updatedAt: String,
    val assignees: List<String> = emptyList(),
    val categories: List<String> = emptyList(),
    val priority: String = "medium",
    val order: Int = 1
)

object MarkdownParser {
    private val frontMatterRegex = Regex("""^---\s*\n(.*?)\n---\s*\n(.*)$""", RegexOption.DOT_MATCHES_ALL)
    
    fun parseTaskFile(file: File): Pair<TaskFrontMatter, String> {
        val content = file.readText()
        val match = frontMatterRegex.find(content)
            ?: throw IllegalArgumentException("Invalid task file format: missing front matter")
        
        val (frontMatterYaml, description) = match.destructured
        val frontMatter = Yaml.default.decodeFromString<TaskFrontMatter>(frontMatterYaml)
        
        return frontMatter to description.trim()
    }
    
    fun writeTaskFile(file: File, frontMatter: TaskFrontMatter, description: String) {
        val yaml = Yaml.default.encodeToString(frontMatter)
        val content = buildString {
            appendLine("---")
            append(yaml.trim())
            appendLine()
            appendLine("---")
            appendLine()
            append(description.trim())
        }
        file.writeText(content)
    }
}
