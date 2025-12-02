plugins {
    kotlin("jvm") version "1.9.21"
    kotlin("plugin.serialization") version "1.9.21"
    application
    id("org.openapi.generator") version "7.1.0"
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

group = "com.ninjacontrol.knutpunkt"
version = "1.0.0"

repositories {
    mavenCentral()
}

val ktorVersion = "2.3.7"
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
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$kotlinxSerializationVersion")
    
    // YAML parsing for front matter
    implementation("com.charleskorn.kaml:kaml:$kamlVersion")
    
    // Markdown parsing
    implementation("org.commonmark:commonmark:$commonmarkVersion")
    
    // Logging
    implementation("ch.qos.logback:logback-classic:$logbackVersion")
    
    // Testing
    testImplementation("io.ktor:ktor-server-tests-jvm:$ktorVersion")
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
}

// Task to build frontend
val buildFrontend by tasks.registering(Exec::class) {
    description = "Build frontend application"
    workingDir = file("../frontend")
    commandLine = if (System.getProperty("os.name").lowercase().contains("windows")) {
        listOf("cmd", "/c", "npm", "run", "build")
    } else {
        listOf("npm", "run", "build")
    }
}

// Task to copy frontend dist to resources
val copyFrontend by tasks.registering(Copy::class) {
    description = "Copy built frontend to backend resources"
    dependsOn(buildFrontend)
    from("../frontend/dist")
    into("src/main/resources/static")
}

// Make processResources depend on copyFrontend
tasks.named("processResources") {
    dependsOn(copyFrontend)
}
