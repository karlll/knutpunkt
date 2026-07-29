---
name: knutpunkt
description: Read and manage tasks on a Knutpunkt Kanban board - list, inspect, create, claim, update, and finish tasks. Use when the user mentions the board, the backlog, tasks by number ("task #12", "claim task 5", "what's planned?"), or asks to file work as a task. Also use to find which Knutpunkt instance serves the current project.
allowed-tools: Bash, Read, Write
---

# Knutpunkt

Knutpunkt is a local Kanban board (columns: `planned`, `ongoing`, `done`) backed by
Markdown files and a REST API. Interact with it through the `kp` CLI in this skill:

```
scripts/kp
```

Use the copy inside this skill directory (`~/.claude/skills/knutpunkt/scripts/kp` when
installed), or plain `kp` if it is on PATH. Run `kp help` for the full usage text.

## Picking the right board

Several boards can run at once, one per project, on different ports. `kp` resolves the
right one automatically: it finds the running instance whose `--project-path` is the
current directory or an ancestor of it. **Just run `kp` from within the project
directory** — no configuration needed.

- `kp where` — show which instance the current directory resolves to
- `kp instances` — list every running board
- If resolution is ambiguous, `kp` fails with the list of candidates. Add `--port <n>`
  to pick one explicitly; don't guess.

## Commands

```sh
kp ls                                  # whole board, grouped by column
kp ls --status planned --priority high # filters: --status --priority --assignee --category
kp get 12                              # full task incl. description (accepts 12, #12 or a UUID)

kp claim 12 --agent "Claude Code"      # planned -> ongoing, adds the agent as assignee
kp done 12                             # -> done
kp move 12 planned                     # any column change

kp new --title "..." --desc-file <path> [--priority high] [--category api] [--assignee X]
kp set 12 --priority high              # partial edit; only the flags given are changed
kp assign 12 karl / kp unassign 12 karl
kp tag 12 backend / kp untag 12 backend
kp rm 12 --yes                         # deletion requires --yes
```

Add `--json` to any read command when you need to parse the result. Prefer the default
output otherwise; it is much more compact.

## Working the board

When the user asks to work on a task:

1. `kp get <n>` to read it in full.
2. `kp claim <n> --agent "Claude Code"` before starting, so the board shows who is on it.
   Only `planned` tasks can be claimed.
3. Do the work.
4. `kp done <n>` when the acceptance criteria are met — not before.

Report task numbers back to the user as `#12`, the way they appear on the board.

## Creating tasks

Descriptions are Markdown and should follow the house structure (`## Overview`,
`## Requirements`, `## Acceptance Criteria`, `## Examples`). Write the description to a
file and pass `--desc-file`, or pipe it in with `--desc-file -`; use `--desc` only for
one-liners.

**Before writing a task description, read `references/task-writing.md`** in this skill
directory. Well-structured tasks are the difference between an agent implementing the
right thing and guessing.

## Anything the CLI does not cover

`references/api.md` documents the endpoints `kp` does not wrap (reordering, live SSE
event streams, settings, terminal sessions) — reach for `curl` against the base URL from
`kp where` only when the task genuinely needs one of those.
