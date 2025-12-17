---
id: "185daa2b-099d-4845-832f-8f5b935224bb"
number: 40
title: "Support external config"
createdAt: "2025-12-17T20:12:18.493598Z"
updatedAt: "2025-12-17T20:31:00.079539Z"
assignees:
- "GitHub Copilot"
categories:
- "backend"
priority: "medium"
order: 1
---

# Externalized Configuration for Ktor

## Overview

Implement a Ktor configuration setup for a fat-jar–based application where user-configurable settings are provided via an external HOCON configuration file. The application must ship with an internal `application.conf` containing sensible defaults, while allowing these values to be overridden by an external config file whose path is provided via a JVM system property. Configuration is read at startup only and requires an application restart to take effect.

## Requirements

- Use HOCON format for all configuration files
- Include an internal `application.conf` on the classpath with sensible default values
- Support an external configuration file provided via a JVM system property (e.g. `-Dconfig.file=/path/to/application.conf`)
- Load and resolve the external configuration at application startup
- Expose configuration to the application via Ktor’s `ApplicationConfig`
- Keep Ktor/server configuration keys (`ktor.*`) separate from application/domain configuration keys (e.g. `myapp.*`)
- Fail fast with clear startup errors if required configuration values are missing or invalid
- Configuration changes must be restart-only (no hot reload)

## Acceptance Criteria

- [ ] Application starts correctly using only the internal `application.conf`
- [ ] Application starts correctly when an external config file path is provided via JVM system properties
- [ ] External configuration values override internal defaults
- [ ] Configuration is accessible via `environment.config` or a derived typed config object
- [ ] Missing or invalid required configuration causes a clear startup failure
- [ ] Configuration changes require an application restart to take effect