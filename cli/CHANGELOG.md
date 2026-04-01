# Changelog

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
