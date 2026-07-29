# Changelog

## [2.0.1] - 2026-07-29

### Fixed

- **Pilot mode now works at all.** Every pilot command called `/v1/*`, an API surface that was never
  built — `openlabor login` 404'd on its first request, and with it `ask`, `chat`, `history`, `team`,
  `tasks` and `run`. They now call the endpoints that exist (`/api/org`, `/api/employees`,
  `/api/employees/:id/chat/:sessionId`, `/api/crons/tasks/...`). Shipped broken in 2.0.0.
- **`openlabor update` actually updates.** It printed `npm install -g openlabor@latest` and returned
  without doing anything — and that package name is not ours and does not exist on npm. It now runs
  the install itself, against `@openlabor/cli`.

### Added

- **`openlabor login` with no argument opens your browser.** You confirm a short code in the
  dashboard and the CLI receives a workspace key. Pasting a key by hand still works via
  `openlabor login --key <api-key>`, but it is no longer the default: the settings page lists both
  workspace and per-employee keys, and an employee key is rejected on org-wide commands.
- **`openlabor upload <employee> <file-or-dir>`** — send documents, briefs or brand assets straight
  into an employee's workspace, a folder at a time. Skips the files OpenLabor generates
  (`SOUL.md`, `AGENTS.md`, …) so an import can never overwrite who an employee is, and refuses to
  replace existing files unless you pass `--overwrite`.
- **`openlabor download <employee> [dest.zip]`** — pull an employee's whole workspace as a zip, in
  one request.
- **`ol` as a shorthand for `openlabor`.** Same command, fewer keystrokes.

### Changed

- **Help rewritten around the two things this CLI does.** The catalog commands (`list`, `install`,
  `search`) copy prompts into your editor; they do not hire anyone. That is now stated where people
  read it, next to the commands that act on the employees actually working in your workspace.

## [2.0.0] - 2026-04-01

### Added

- **Pilot mode.** Chat with your AI employees and control scheduled tasks — requires an OpenLabor account.
  - `openlabor ask "message"` — new conversation, auto-routes to best employee.
  - `openlabor ask <employee> "message"` — new conversation with specific employee.
  - `openlabor chat "message"` — continue last conversation.
  - `openlabor chat <employee> "message"` — continue with specific employee.
  - `openlabor history` — list all conversations.
  - `openlabor history <employee>` — list employee's conversations.
  - `openlabor team` — list your org's live employees (name, role, department, skills).
  - `openlabor tasks <employee>` — list scheduled tasks.
  - `openlabor run <task-id>` — run a scheduled task immediately.
  - `openlabor login <api-key>` / `openlabor logout` / `openlabor whoami` — credentials.
- **Auto-routing.** `ask` without an employee name automatically routes to the best employee based on message keywords.
- **Session management.** Sessions are tracked locally — no session IDs needed. `ask` creates, `chat` continues.
- **API client.** Zero-dependency HTTP client for the OpenLabor API (Node 18+ built-in `fetch`).
- **Credential management.** Stored at `~/.openlabor/credentials.json` with login/logout/whoami.
- **JSON output mode.** Set `OPENLABOR_JSON=1` for structured output (useful for AI tool integrations).
- **Pilot command file.** Installable Claude Code command that teaches AI tools how to orchestrate employees.

## [1.0.0] - 2026-03-26

### Added

- **CLI for browsing and installing OpenLabor skills.** `openlabor list employees`, `openlabor list skills`, `openlabor search`, and `openlabor install` commands.
- **Multi-tool support.** Install into Claude Code, Cursor, Codex, OpenCode, Windsurf, or raw files via `--target` flag. Auto-detects your tool.
- **Remote registry.** When run outside the repo, fetches skills directly from GitHub.
- **Versioning system.** `openlabor version`, `openlabor update`, `openlabor outdated`, `openlabor update-skills` commands.
- **Config management.** `openlabor config` with `~/.openlabor/config.yaml` for `auto_upgrade`, `default_target`, `update_check`.
- **Shell-based update check.** `bin/openlabor-update-check` runs periodic checks with snooze escalation (24h → 48h → 7d).
- **Version tracking on installed skills.** Every installed file includes a version marker for outdated detection.
