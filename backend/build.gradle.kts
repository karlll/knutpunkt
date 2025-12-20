import java.time.Instant

plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    application
    id("org.openapi.generator") version "7.1.0"
    id("com.github.johnrengelman.shadow") version "8.1.1"
    jacoco
}

group = "com.ninjacontrol.knutpunkt"
version = "0.9.0"

repositories {
    mavenCentral()
}

val ktorVersion = "3.0.3"
val kotlinxSerializationVersion = "1.6.2"
val kamlVersion = "0.55.0"
val commonmarkVersion = "0.21.0"
val logbackVersion = "1.4.14"

dependencies {
    // Ktor server
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-cors-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-status-pages-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-html-builder-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-sse-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-websockets-jvm:$ktorVersion")
    
    // PTY (pseudo-terminal) for terminal emulation
    implementation("org.jetbrains.pty4j:pty4j:0.13.4")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$kotlinxSerializationVersion")
    
    // YAML parsing for front matter
    implementation("com.charleskorn.kaml:kaml:$kamlVersion")
    
    // Markdown parsing
    implementation("org.commonmark:commonmark:$commonmarkVersion")
    
    // Logging
    implementation("ch.qos.logback:logback-classic:$logbackVersion")
    
    // HOCON configuration
    implementation("com.typesafe:config:1.4.3")
    
    // Testing
    testImplementation("io.ktor:ktor-server-test-host-jvm:$ktorVersion")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5:1.9.21")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

application {
    mainClass.set("com.ninjacontrol.knutpunkt.ApplicationKt")
}

// OpenAPI Generator configuration (disabled - using custom models)
// We reference the OpenAPI spec for documentation but use hand-written models
// to ensure proper kotlinx.serialization support

tasks.named<Test>("test") {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = false
    }
    finalizedBy(tasks.jacocoTestReport) // Generate coverage report after tests
}

// Configure Jacoco for code coverage
jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test) // Ensure tests run before generating report
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }
}

// Add build metadata to JAR manifest when jar tasks are executed
// This runs during configuration but doesn't force jar into test graph
tasks.matching { it.name == "jar" || it.name == "shadowJar" }.configureEach {
    if (this is Jar) {
        manifest {
            attributes(mapOf(
                "Implementation-Title" to "Knutpunkt",
                "Implementation-Version" to version,
                "Implementation-Vendor" to "NinjaControl",
                "Build-Timestamp" to Instant.now().toString(),
                "Build-Jdk" to "${System.getProperty("java.version")} (${System.getProperty("java.vendor")})",
                "Git-Commit" to (System.getenv("GITHUB_SHA") ?: "dev"),
                "Built-By" to (System.getenv("GITHUB_ACTOR") ?: System.getProperty("user.name"))
            ))
        }
    }
}

// Task to copy pre-built frontend to backend resources
// Frontend must be built separately (e.g., via `make dist` or manually with `npm run build`)
val copyFrontend by tasks.registering(Copy::class) {
    description = "Copy pre-built frontend to backend static resources"
    val frontendDistDir = layout.projectDirectory.dir("../frontend/dist")
    from(frontendDistDir)
    into(layout.buildDirectory.dir("frontend-dist"))
}

// Include frontend in JAR tasks if it has been built
tasks.matching { it.name == "jar" || it.name == "shadowJar" }.configureEach {
    if (this is Jar) {
        dependsOn(copyFrontend)
        from(copyFrontend.map { it.destinationDir }) {
            into("static")
        }
    }
}
