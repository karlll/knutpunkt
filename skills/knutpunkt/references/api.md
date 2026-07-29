# Knutpunkt REST API — what `kp` does not wrap

Base URL: whatever `kp where` reports, e.g. `http://127.0.0.1:8080/api/v1`.
Full specification: `api/openapi.yaml` in the Knutpunkt repo.

`kp` covers all of `/tasks`. The endpoints below have no CLI wrapper; use `curl` for
them when a task genuinely requires it.

## Reordering

```
PATCH /tasks/{id}/order
{ "newOrder": 3, "newStatus": "ongoing" }   # newStatus optional
```

Returns `{ "updated": [Task, ...] }` — every task whose order shifted. Order is
1-based within a column. `kp set <n> --order N` sets the field directly via PUT, which
does **not** re-flow the other cards; use this endpoint when the surrounding order
matters.

## Live event streams (SSE)

```
GET /events/tasks    # task.created | task.updated | task.deleted, with the full task
GET /events/files    # file.created | file.modified | file.deleted (cache invalidation)
```

Both are `text/event-stream` with a periodic keepalive. Only useful for a long-running
watcher — a one-shot agent should poll `kp ls` instead.

```sh
curl -N http://127.0.0.1:8080/api/v1/events/tasks
```

## Settings

```
GET /settings     # {"settings":[{"key","value","description"}, ...]}
PUT /settings     # {"key":"title","value":"..."} — only `title` is writable
```

Keys include `server.port`, `tasks.directory`, `tasks.cacheEnabled`, `terminal.enabled`,
`sse.keepaliveIntervalSeconds`, `title`, and `project.path`. `project.path` is what `kp`
uses to match an instance to the current directory; it is set with `--project-path` at
startup and persisted in `state.json` in the tasks directory.

## Terminal sessions

```
GET    /terminal/sessions
DELETE /terminal/sessions/{id}
PATCH  /terminal/sessions/{id}
```

Only present when the server was started with `--terminal=true`.

## Running a board

```sh
./start.sh <tasks-dir> --port=8090 --project-path=/path/to/project --title="My Project"
```

`--project-path` is what makes automatic instance resolution work; always pass it when
running more than one board.
