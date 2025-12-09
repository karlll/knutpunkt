---
id: "5d31d02b-ffc2-4792-a597-93e66460de93"
number: 26
title: "Fix OpenAPI Spec and Backend Implementation Discrepancies"
createdAt: "2025-12-08T20:54:06.616602Z"
updatedAt: "2025-12-09T19:02:37.597145Z"
assignees:
- "Claude Code"
categories:
- "backend"
- "api"
- "documentation"
- "bug"
priority: "high"
order: 1
---

# Fix OpenAPI Spec and Backend Implementation Discrepancies

## Overview

Analysis of the OpenAPI specification (`api/openapi.yaml`) against the backend implementation reveals several critical discrepancies that will cause integration failures with frontend clients. This task tracks the fixes needed to align the backend with the contract defined in the spec.

## Critical Issues (Breaking Changes)

### 1. TaskDeleted Event Missing Full Task Object 🔴

**Location:** `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt:143-148`

**Problem:**
- OpenAPI spec (lines 670-684) promises the full task object in deleted events: "The `task` field contains the task's state before deletion"
- Backend only includes `title` and `status` fields

**Current Implementation:**
```kotlin
data class TaskDeleted(
    override val taskId: String,
    override val timestamp: String,
    val title: String,        // ❌ Only title
    val status: TaskStatus    // ❌ Only status
) : TaskEvent()
```

**Required Fix:**
```kotlin
data class TaskDeleted(
    override val taskId: String,
    override val timestamp: String,
    val task: Task  // ✅ Add full task object
) : TaskEvent() {
    override val eventType: String = "task.deleted"
}
```

**Impact:** Frontend clients expecting full task object will fail to deserialize or lose critical data.

**Files to Update:**
- `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt`
- `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/services/TaskService.kt` (anywhere TaskDeleted events are emitted)

---

### 2. TaskChanges Field Names Don't Match Spec 🔴

**Location:** `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt:152-160`

**Problem:**
- OpenAPI spec (lines 639-668) defines change tracking with simple field names: `title`, `description`, `status`, etc.
- Backend uses suffixed names: `titleChanged`, `descriptionChanged`, etc.
- JSON serialization will produce incorrect field names

**Current Implementation:**
```kotlin
@Serializable
data class TaskChanges(
    val titleChanged: Boolean = false,      // ❌ Should serialize as "title"
    val descriptionChanged: Boolean = false, // ❌ Should serialize as "description"
    val statusChanged: Boolean = false,      // ❌ Should serialize as "status"
    val priorityChanged: Boolean = false,    // ❌ Should serialize as "priority"
    val assigneesChanged: Boolean = false,   // ❌ Should serialize as "assignees"
    val categoriesChanged: Boolean = false,  // ❌ Should serialize as "categories"
    val orderChanged: Boolean = false        // ❌ Should serialize as "order"
)
```

**Required Fix (Option A - Use @SerialName):**
```kotlin
@Serializable
data class TaskChanges(
    @SerialName("title") val titleChanged: Boolean = false,
    @SerialName("description") val descriptionChanged: Boolean = false,
    @SerialName("status") val statusChanged: Boolean = false,
    @SerialName("priority") val priorityChanged: Boolean = false,
    @SerialName("assignees") val assigneesChanged: Boolean = false,
    @SerialName("categories") val categoriesChanged: Boolean = false,
    @SerialName("order") val orderChanged: Boolean = false
)
```

**Required Fix (Option B - Rename Fields):**
```kotlin
@Serializable
data class TaskChanges(
    val title: Boolean = false,
    val description: Boolean = false,
    val status: Boolean = false,
    val priority: Boolean = false,
    val assignees: Boolean = false,
    val categories: Boolean = false,
    val order: Boolean = false
)
```

**Recommended:** Option A preserves internal code readability while fixing serialization.

**Impact:** Frontend clients will look for `title` field but receive `titleChanged`, causing parsing errors.

**Files to Update:**
- `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt`
- Review `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/services/TaskService.kt` for any code constructing TaskChanges

---

## Documentation Issues (Non-Breaking)

### 3. Missing Timestamp Field in TaskEvent Schema 🟡

**Location:** `api/openapi.yaml:582-615`

**Problem:**
- Backend implementation includes `timestamp` field in all TaskEvent types (Models.kt:119)
- Timestamp is used as SSE event ID (EventRoutes.kt:27)
- OpenAPI schema doesn't document this field

**Required Fix:**
Add to TaskEvent schema in openapi.yaml:
```yaml
TaskEvent:
  type: object
  required:
    - eventType
    - taskId
    - task
    - timestamp  # Add this
  properties:
    eventType:
      # ... existing ...
    taskId:
      # ... existing ...
    timestamp:  # Add this
      type: string
      format: date-time
      description: ISO 8601 timestamp when the event occurred
      example: "2025-01-15T10:30:00Z"
    task:
      # ... existing ...
```

**Files to Update:**
- `api/openapi.yaml`

---

### 4. Inconsistency Between CLAUDE.md and OpenAPI Spec 🟡

**Location:** `CLAUDE.md` vs `api/openapi.yaml`

**Problem:**
- CLAUDE.md documents two SSE endpoints:
  - `GET /api/v1/events/tasks` - Task-level events
  - `GET /api/v1/events/files` - File-level events
- OpenAPI spec only documents `GET /events`
- Backend only implements `GET /events` (exposes task events only)
- Backend has `FileEventService` but no route exposes it

**Decision Required:**
Choose one of the following approaches:

**Option A: Implement File Events Endpoint**
- Add `GET /events/files` route
- Wire up FileEventService to SSE endpoint
- Document in OpenAPI spec

**Option B: Clarify Documentation**
- Update CLAUDE.md to reflect that file events are internal only
- Clarify that `/events` is the single public SSE endpoint for task events
- Note that two-tier architecture is internal implementation detail

**Recommendation:** Option B - The file events are infrastructure-level and likely don't provide value to frontend clients. Task events are the high-level semantic events clients care about.

**Files to Update:**
- `CLAUDE.md` (if choosing Option B)
- `api/openapi.yaml` and routing code (if choosing Option A)

---

## Acceptance Criteria

### Critical Fixes (Must Complete)
- [ ] `TaskDeleted` event includes full `task: Task` object
- [ ] `TaskChanges` fields serialize with correct names (title, description, etc.)
- [ ] All existing tests pass after changes
- [ ] Manual testing: SSE events deserialize correctly on frontend

### Documentation Fixes (Should Complete)
- [ ] OpenAPI spec documents `timestamp` field in TaskEvent schema
- [ ] Architecture documentation aligns with implementation (either add /events/files or clarify it's internal)

### Testing
- [ ] Unit tests for TaskEvent serialization verify field names
- [ ] Integration tests for SSE endpoint verify event structure
- [ ] Test that TaskDeleted events include all task fields

---

## Implementation Notes

### Order of Operations
1. **First:** Fix Models.kt data classes (critical fixes #1 and #2)
2. **Second:** Update TaskService.kt to emit correct events
3. **Third:** Update OpenAPI spec documentation
4. **Fourth:** Run tests and verify
5. **Fifth:** Update CLAUDE.md if needed

### Breaking Change Considerations
- These are breaking changes for any existing SSE clients
- Consider versioning strategy if clients exist
- Document in changelog/release notes

### Testing Strategy
```bash
# Backend tests
cd backend
./gradlew test

# Manual SSE testing
curl -N http://localhost:8080/api/v1/events

# In another terminal, trigger events
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test task"}'
```

---

## Related Files

### Must Change
- `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt:143-148` (TaskDeleted)
- `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt:152-160` (TaskChanges)
- `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/services/TaskService.kt` (event emission)

### Should Review
- `api/openapi.yaml:582-615` (TaskEvent schema)
- `api/openapi.yaml:670-684` (TaskDeletedEvent schema)
- `CLAUDE.md` (architecture documentation)

### Test Files
- `backend/src/test/kotlin/com/ninjacontrol/knutpunkt/` (if tests exist)

---

## References

- OpenAPI Spec: `api/openapi.yaml`
- Backend Models: `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/models/Models.kt`
- Event Routes: `backend/src/main/kotlin/com/ninjacontrol/knutpunkt/routes/EventRoutes.kt`
- Architecture Docs: `CLAUDE.md` (Event System section)