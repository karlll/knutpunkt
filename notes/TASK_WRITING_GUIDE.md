# Task Writing Guide for LLM Agents

**Purpose:** Guidelines for writing task descriptions that LLM agents can effectively understand and implement.

---

## Core Principles

1. **Be explicit, not implicit** - State what needs to be done, don't assume context
2. **Provide structure** - Use clear sections and formatting
3. **Include examples** - Show what "done" looks like
4. **Define boundaries** - Specify what's in and out of scope

---

## Required Sections

### 1. Overview
- **1-2 sentences** summarizing the task goal
- Answer: "What problem does this solve?"

```markdown
## Overview

Add user authentication to the backend API using JWT tokens.
This enables secure access control for all protected endpoints.
```

### 2. Context (Optional but Recommended)
- Why this task exists
- Related tasks or dependencies
- Links to relevant documentation

```markdown
## Context

Users currently have no way to authenticate. This is a prerequisite
for implementing role-based access control (task #12).

See: https://jwt.io/introduction
```

### 3. Requirements
- **Specific, actionable items** that must be implemented
- Use bullet points or numbered lists
- Include technical details (file paths, function names, API endpoints)

```markdown
## Requirements

- Create `AuthService.kt` in `backend/src/main/kotlin/services/`
- Implement JWT token generation using HS256 algorithm
- Add `/api/v1/auth/login` endpoint accepting username/password
- Add `/api/v1/auth/refresh` endpoint for token renewal
- Store secret key in environment variable `JWT_SECRET`
```

### 4. Acceptance Criteria
- **Testable conditions** that define "done"
- Use checkboxes `- [ ]` format
- Should be verifiable (not subjective)

```markdown
## Acceptance Criteria

- [ ] Login endpoint returns valid JWT token
- [ ] Token expires after 24 hours
- [ ] Invalid credentials return 401 status
- [ ] Protected endpoints reject requests without valid token
- [ ] All tests pass
```

### 5. Technical Constraints (Optional)
- Libraries/frameworks to use (or avoid)
- Performance requirements
- Compatibility requirements

```markdown
## Technical Constraints

- Must use `io.jsonwebtoken:jjwt-api:0.12.0`
- Token validation must complete in <10ms
- Compatible with existing CORS configuration
```

### 6. Examples (Highly Recommended)
- Sample inputs and outputs
- Code snippets showing expected usage
- File structure examples

```markdown
## Examples

### Request
\`\`\`json
POST /api/v1/auth/login
{
  "username": "alice",
  "password": "secret123"
}
\`\`\`

### Response
\`\`\`json
{
  "token": "eyJhbGc...",
  "expiresAt": "2025-12-05T19:42:00Z"
}
\`\`\`
```

---

## Best Practices

### DO ✅

- **Use absolute file paths** when possible
  - Good: `backend/src/main/kotlin/services/AuthService.kt`
  - Bad: "the auth service file"

- **Specify exact names** for functions, classes, variables
  - Good: "Create function `generateToken(userId: String): String`"
  - Bad: "Add a token generation function"

- **Include error cases**
  - "Return 400 if username is empty"
  - "Throw `InvalidTokenException` if token is malformed"

- **Reference existing code patterns**
  - "Follow the same structure as `TaskService.kt`"
  - "Use the error handling pattern from `TaskRoutes.kt`"

- **Provide test scenarios**
  - "Test with expired token"
  - "Test with missing Authorization header"

### DON'T ❌

- **Be vague**
  - Bad: "Make it work better"
  - Bad: "Improve performance"

- **Use ambiguous terms**
  - Bad: "Add some validation"
  - Bad: "Handle edge cases"

- **Assume knowledge**
  - Bad: "Use the standard approach"
  - Bad: "Implement using best practices"

- **Mix multiple unrelated features**
  - Bad: "Add auth AND implement caching AND refactor routes"
  - Good: Create separate tasks for each feature

- **Skip acceptance criteria**
  - Every task needs measurable success conditions

---

## Template

```markdown
## Overview

[1-2 sentence description of what and why]

## Context

[Background information, dependencies, related tasks]

## Requirements

- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]

## Acceptance Criteria

- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## Technical Constraints

- [Constraint 1]
- [Constraint 2]

## Examples

### [Example 1 Name]
\`\`\`
[Code or data example]
\`\`\`

### [Example 2 Name]
\`\`\`
[Code or data example]
\`\`\`

## Notes

[Any additional context, warnings, or considerations]
```

---

## Examples: Good vs Bad

### ❌ Bad Task Description
```
## Overview
Fix the bugs in the frontend

## Requirements
- Make it work
- Clean up the code
```

**Why bad:** Vague, no specifics, subjective criteria, no examples

### ✅ Good Task Description
```
## Overview
Fix React useEffect dependency warnings in TaskCard component causing
infinite re-render loops.

## Requirements
- Update `frontend/src/components/kanban/TaskCard.tsx`
- Add missing dependencies to useEffect on line 42
- Memoize `handleUpdate` callback using useCallback
- Remove stale `console.log` statements

## Acceptance Criteria
- [ ] No console warnings about missing dependencies
- [ ] Component renders exactly once per prop change
- [ ] Drag and drop functionality still works
- [ ] All existing tests pass

## Examples

### Current Code (line 42)
\`\`\`typescript
useEffect(() => {
  updateTask(taskId);
}, []); // Missing taskId dependency
\`\`\`

### Expected Fix
\`\`\`typescript
const handleUpdate = useCallback(() => {
  updateTask(taskId);
}, [taskId]);

useEffect(() => {
  handleUpdate();
}, [handleUpdate]);
\`\`\`
```

**Why good:** Specific file/line, clear problem, concrete solution, testable criteria, includes code examples

---

## Special Considerations for LLM Agents

1. **File paths matter** - Agents navigate by exact paths
2. **Code examples are gold** - Show don't tell when possible
3. **Break down complexity** - One focused task > one mega-task
4. **List dependencies** - "Do X before Y" prevents wasted effort
5. **Specify tools/commands** - "Run `npm test`" vs "test it"

---

## Task Size Guidelines

| Size | Lines of Code Changed | Time Estimate | Complexity |
|------|----------------------|---------------|------------|
| Small | <50 | <30 min | Single file, clear change |
| Medium | 50-200 | 30-90 min | Multiple files, some design |
| Large | 200-500 | 2-4 hours | New feature, testing needed |
| Too Large | >500 | >4 hours | **Split into smaller tasks** |

**Rule of thumb:** If you can't write clear acceptance criteria, the task is too big.

---

## Quick Checklist

Before creating a task, verify:

- [ ] Task has a clear, specific goal
- [ ] All file paths are explicit
- [ ] Requirements are actionable (verbs: create, update, delete, add)
- [ ] Acceptance criteria are testable
- [ ] At least one example is provided
- [ ] Success state is unambiguous
- [ ] Task is focused (one main objective)
- [ ] Dependencies are listed

---

## Summary

**Good task descriptions enable LLM agents to:**
1. Understand the goal immediately
2. Know exactly which files to modify
3. See what the end result should look like
4. Verify their work against clear criteria
5. Ask clarifying questions if needed

**Remember:** Time spent writing a clear task description is time saved in implementation and debugging.
