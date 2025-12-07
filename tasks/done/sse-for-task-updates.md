---
id: "02930fde-9cae-4571-b218-fbf4a1e85b5f"
number: 9
title: "SSE for task updates"
createdAt: "2025-12-04T20:29:54.595463Z"
updatedAt: "2025-12-07T21:14:15.274034Z"
assignees:
- "GitHub Copilot"
categories:
- "backend"
priority: "medium"
order: 8
---

# Publish SSE for updates detected by FileWatchService

## Overview

The events that are produced by the changes that are detected by the FileWatchService should be published using SSE.

## Requirements

- Create a minimal format for the event, it should contain the event type and any additional information related to the particular event type
- Update the OpenAPI spec to include the SSE endpoint (call it "events")
- Events should be published when a file watch event is triggered by the backend

## Acceptance criteria

- [] There are integration tests that verifies the event generation
- [] OpenAPI spec is updated with the event endpoint ("events")
- [] All tests (new and old) pass