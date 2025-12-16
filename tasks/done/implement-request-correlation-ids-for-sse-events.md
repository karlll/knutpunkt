---
id: "c82d3a7e-a428-4b03-bb43-cca10ec21e5a"
number: 11
title: "Implement request correlation IDs for SSE events"
createdAt: "2025-12-05T20:35:01.595342Z"
updatedAt: "2025-12-16T18:39:17.524311Z"
assignees: []
categories:
- "backend"
- "frontend"
- "enhancement"
priority: "medium"
order: 2
---

# Implement request correlation IDs for SSE events

## Overview
Add request correlation to distinguish between self-generated and external SSE events, preventing unnecessary UI updates when a client receives events for changes it initiated.

## Requirements
- Add `X-Request-ID` header support to all mutation endpoints (POST/PUT/PATCH/DELETE)
- Backend must track request ID through the pipeline: API request → file write → FileWatchService → SSE event
- Include `requestId` field in SSE TaskEvent payloads
- Frontend should generate UUID for each mutation and include in request header
- Frontend should ignore SSE events where `requestId` matches its own pending requests

## Implementation Details
### Backend Changes
- Update `TaskService` methods to accept optional `requestId: String?` parameter
- Store request ID in correlation context during file operations
- Modify `FileChangeEvent` to include `requestId: String?`
- Add `requestId` field to `TaskEvent` models
- Extract request ID from call context in routes: `call.request.header("X-Request-ID")`

### Frontend Changes
- Generate UUID for each mutation using crypto.randomUUID()
- Track pending request IDs in React state or context
- Include `X-Request-ID` header in all API mutation calls
- Filter SSE events by comparing `event.requestId` with pending IDs
- Clear request ID from pending set after timeout (~5s)

## Acceptance Criteria
- [ ] Backend accepts and propagates `X-Request-ID` through file operations
- [ ] SSE events include `requestId` when available
- [ ] Frontend includes request ID header on mutations
- [ ] Frontend correctly ignores self-generated events
- [ ] Integration tests verify request ID propagation
- [ ] All existing tests still pass

## Notes
This builds on the SSE implementation (task #9). Client-side optimistic updates (TanStack Query) should already be handling immediate UI feedback; this enhancement prevents the "flash" when SSE confirms the change.