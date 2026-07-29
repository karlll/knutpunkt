# Knutpunkt Agent Skills

Claude Code skills for working with Knutpunkt boards. These are an alternative to the
MCP server in `mcp-server/`, aimed at agents that run in many projects against many
boards at once.

```
skills/
├── install.sh
└── knutpunkt/
    ├── SKILL.md                    # the skill itself
    ├── scripts/kp                  # CLI over the Knutpunkt REST API (Node 20+, no deps)
    └── references/
        ├── task-writing.md         # loaded only when writing a task description
        └── api.md                  # endpoints kp does not wrap
```

## Install

```sh
./skills/install.sh
```

This symlinks `skills/knutpunkt` into `~/.claude/skills/`, so the skill is available in
every project and this repository stays the source of truth. Use `--copy` for a
standalone copy, `--uninstall` to remove.

### Put `kp` on PATH

```sh
ln -s ~/.claude/skills/knutpunkt/scripts/kp ~/.local/bin/kp
```

Not strictly required — the skill can invoke the CLI by its full path — but it makes the
permission rule below much tidier, and lets you use `kp` from your own shell.

### Avoid a permission prompt per call

Unlike MCP tools, which are approved once per tool, every `kp` invocation is a `Bash`
call and will raise a permission prompt unless it is allowlisted. Add to
`~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(kp:*)"]
  }
}
```

Merge this into any `permissions.allow` array you already have rather than replacing it.

The rule matches on the command as written, so it only covers invocations of `kp`
itself — it requires the PATH symlink above. Without it, allowlist the full path
instead:

```json
{
  "permissions": {
    "allow": ["Bash(~/.claude/skills/knutpunkt/scripts/kp:*)"]
  }
}
```

Use `.claude/settings.json` inside a project instead of `~/.claude/settings.json` if you
want the allowance scoped to that project rather than to every session. Note that this
allows all `kp` subcommands, including `kp rm <n> --yes`; narrow it to specific
subcommands (`"Bash(kp ls:*)"`, `"Bash(kp get:*)"`) if you want deletions to keep
prompting.

## Why skills instead of MCP

**Context.** An MCP server's tool schemas are loaded into every session whether or not
the board is touched — for `mcp-server/` that is roughly 4–5k tokens, doubled if you
configure a second board. A skill costs one description line (~30 tokens) until the
model actually needs it; the task-writing guidance loads only when a task is being
written. Additional boards cost nothing.

**Multiple boards.** `kp` finds the instance whose `--project-path` contains the current
directory, so agents in different projects (or git worktrees) each talk to their own
board with no per-project configuration and no extra server processes.

**Output.** `kp ls` prints one line per task. The MCP `list_tasks` tool returned a
six-line block per task *plus* the full description of every task in `_meta`.

**Task references.** `kp` accepts board numbers (`kp get 12`), resolving them to UUIDs
itself. The API only matches on UUID, so MCP tool calls needed a `list_tasks` round trip
first.

## The MCP server is still there

Skills are Claude Code / Agent SDK only. `mcp-server/` remains the integration path for
Claude Desktop, GitHub Copilot, and any other MCP client. Both talk to the same REST API
and can be used against the same board at the same time.

## Running boards for several projects

```sh
./start.sh ~/projects/foo/tasks --port=8090 --project-path=~/projects/foo --title="Foo"
./start.sh ~/projects/bar/tasks --port=8091 --project-path=~/projects/bar --title="Bar"
```

`--project-path` is what makes resolution automatic. Check it with `kp instances` and
`kp where`.

Each instance registers itself in `~/.knutpunkt/instances.json` (override the directory
with `$KNUTPUNKT_HOME`), so `kp` finds boards on any port rather than only the default
8080–8099 scan range. Resolution still works without the registry — a board on an
unusual port whose registration failed remains discoverable within the scan range, and
`--ports 9000-9010` always overrides both. Boards from a backend build that predates the
registry simply don't appear in the file and are found by scanning as before.
