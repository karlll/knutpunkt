# Writing Knutpunkt task descriptions

A task is read by an agent with no memory of the conversation that produced it. Assume
zero context: everything needed to implement and verify the work must be in the text.

The full guide lives in `docs/TASK_WRITING_GUIDE.md` in the Knutpunkt repo. This is the
working summary.

## Principles

1. **Be explicit, not implicit.** Absolute file paths, exact function names, real error
   codes. "Fix the auth bug" is not a task; "`AuthService.validateToken()` in
   `backend/src/.../AuthService.kt:88` accepts expired tokens" is.
2. **Make it testable.** Every acceptance criterion must be something someone can check
   and get a yes/no answer to.
3. **Keep it to one objective.** If the title needs an "and", it is probably two tasks.
4. **Define the boundaries.** Say what is out of scope when it is not obvious.

## Structure

```markdown
## Overview

One or two sentences: what this changes and why. State the problem, not the solution,
when the solution is the point of the task.

## Context (optional)

Why this exists, related tasks (#12), links to docs or prior discussion.

## Requirements

- Specific, actionable bullets, each naming files and symbols
- `path/to/file.ts` — add `functionName()` that does X
- Add endpoint `POST /api/v1/resource` returning the `Task` schema
- Cover the edge case where the list is empty

## Acceptance Criteria

- [ ] Testable condition with an unambiguous outcome
- [ ] `npm test` passes with a new test covering Y
- [ ] The board shows the task in `done` only after Z

## Examples (optional but valuable)

Code snippets, expected request/response payloads, before/after output, or the exact
file layout the change should produce.
```

## Title

One line, under ~70 characters, specific enough to be recognisable in a list of 40
tasks. Prefix with an area when the board is busy: `frontend: ...`, `api: ...`.

## Fields

- `--priority high` — blocks other work or a release; `low` — nice to have. Default
  `medium`.
- `--category` — the area(s): `frontend`, `backend`, `api`, `docs`, `bug`. Reuse
  categories already on the board (`kp ls` shows them) rather than inventing synonyms.
- Leave tasks unassigned unless someone has actually committed to them; `kp claim` sets
  the assignee at the moment work starts.

## Anti-patterns

- Referring to "the discussion above" or "as we said" — the agent cannot see it.
- Acceptance criteria that restate the requirements instead of defining verification.
- Bundling refactor + feature + tests for three subsystems into one task.
- Describing the desired implementation in prose when a five-line code example is exact.
