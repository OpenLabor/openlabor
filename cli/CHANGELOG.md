# Changelog

## [2.2.1] - 2026-08-27

### Fixed

- **The catalog now ships inside the package.** Installed from npm, every catalog
  command failed with `Employees directory not found: node_modules/@openlabor/employees`.
  The cause: the catalog path was `resolve(__dirname, '../..')`, which is the repo root
  in a git clone and `node_modules/@openlabor` in an npm install — and the check was
  only that the directory existed, which it does. So the remote fallback never ran and
  `list`, `search` and `install` all threw for anyone who was not working inside a
  clone.

  `prepack` now copies `employees/` and `skills/` into `cli/catalog/`, and path
  resolution looks there first, then at the repo root, and reports the catalog as
  unavailable rather than throwing when neither holds one. The free path works offline
  after install.

- **`registry.json` regenerated.** It listed 15 employees and 26 skills. There are 16
  and 52.

### Changed

- **Published as `openlabor` instead of `@openlabor/cli`.** Every README and every post
  says `npx openlabor`, which was a 404, because npm does not infer a scope — the only
  published name was the scoped one. The short name is the one people type, so it is
  now the real package rather than a forwarder.

  `@openlabor/cli` continues to work: it is published from `cli-alias/` as a thin
  alias that depends on `openlabor` and hands every command over. Anything already
  pinned to the scoped name keeps running and stops being stuck on 2.2.0. It is
  deprecated on npm with a pointer to the short name.

  `openlabor update` installs `openlabor` now.

## [2.2.0] - 2026-08-07

### Changed

- **`upload` no longer refuses the generated persona files.** `SOUL.md`, `MEMORY.md`,
  `AGENTS.md`, `IDENTITY.md`, `TOOLS.md`, `USER.md`, `HEARTBEAT.md`, `DREAMS.md` and
  `BOOTSTRAP.md` used to be skipped outright, on the grounds that replacing who an employee
  is — or everything it has learned — should not be a one-liner. That was the right instinct
  in the wrong place: it protected those files from this CLI and from nothing else, and it
  turned "be careful" into "you cannot", so the way to edit one was to go around the CLI.

  The server now folds an incoming version into what is already in the workspace instead of
  replacing it: the push wins where the two disagree, and anything it does not mention
  survives untouched. A merged file prints `(merged into the existing file)` and is counted
  separately in the summary, because what landed on disk is not what was sent.

  Needs an API carrying the merge (deployed 2026-08-07). Against an older one, these files
  are written as before — pass `--overwrite` and know what you are replacing.

## [2.1.0] - 2026-08-04

### Added

Commands that build a team, rather than talk to one. Before these, an agent holding an API key
could message employees but not create any, so every migration guide fell back to hand-written
curl against endpoints that drift.

- **`openlabor hire`** — with no argument, lists the roles you can hire. `hire <role> "<name>"`
  hires one; `hire --custom "<name>" --role <r> --description <d>` creates one we don't ship.
  A role is single-occupancy, so re-running an import is refused rather than duplicated.
- **`openlabor skill create "<name>" --file <path>`** — the file is the instruction, verbatim.
  `--for <employee>` installs it on someone.
- **`openlabor context`** / **`context set --file <path>`** — read or replace the company brain
  (`hq/COMPANY.md`). `set` replaces; read first and merge if you mean to keep what's there.
- **`openlabor skill catalog`** / **`openlabor skill list <employee>`** — two questions, two sources.
  The catalog is the database: every skill the workspace holds, installed or not. The list reads the
  employee's own workspace files, because that is where an installed skill actually lives — a real
  employee here shows 7 skills on disk against 0 rows in `employee_skills`, so answering from the
  database would have reported an employee who knows nothing.
- **`openlabor skill update <employee> <skill> --file <path>`** — rewrite a skill one employee
  already has. Their copy, not the catalog: the catalog is shared by the whole workspace, so
  editing it would change what everyone else is served. The edit outranks the catalog from then
  on — a later version bump reports the file as customised and leaves it alone rather than
  overwriting the correction. Not to be confused with `openlabor update-skills`, which refreshes
  the prompt files this CLI copied into your editor and has nothing to do with employees.
- **`openlabor upload --hq <path>`** — upload into the org's shared HQ folder. `upload <employee>
  x.md --dir hq` looked like it did this and did not: an employee upload is fenced to that
  employee's own directory, so it wrote `<employee>/hq/x.md`, a private folder wearing a shared
  name. `--hq` takes the org-scoped route instead, and refuses `COMPANY.md` — that one belongs to
  `context set`, which also keeps the database and the memory backend in step with the file.

All three honour `OPENLABOR_JSON=1`. Written for Settings → Import, which hands your existing
Claude Code or OpenClaw agent a prompt built entirely on this CLI.

## [2.0.2] - 2026-07-31

### Fixed

Making the CLI usable by an agent, not just by a person at a terminal.

- **Colours are no longer emitted when nobody can see them.** Output kept its ANSI codes when piped,
  so a caller parsing `whoami` got `\x1b[1mLogged in\x1b[0m`. Now silenced off-TTY and under
  `NO_COLOR`.
- **Errors honour `OPENLABOR_JSON=1`.** Structured mode covered the success path only, so the moment
  something failed — the moment a caller has to branch — it got coloured prose. Failures now emit
  `{"ok":false,"error":"…","hint":"…"}`. The catalog commands (`list`, `search`) emit JSON too.
- **`whoami` asks the server instead of reading a file.** It reported "Logged in" for a key the API
  rejects with 401. It now validates, and exits non-zero when the stored credentials are dead.
- **401/403 say what to do.** `Request failed: 401` became "Not authenticated — run `openlabor
  login`", and a `guest_forbidden` 403 now explains that the key only covers one employee.

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

- **`install employee` is now `install role`** (old spelling still works). It never hired anyone —
  it copies a prompt file into your editor — and for anyone coming from the product, "install
  employee" read like recruiting. Same for `list employees` → `list roles`.
- **Prompt-file commands grouped under `prompts`**: `prompts outdated` and `prompts refresh`
  (previously `outdated` and `update-skills`, both still working). `update` now unambiguously means
  "update the CLI itself" — the word used to mean two different things depending on the suffix.
- **The API address is a constant, not a setting.** It was declared twice (`pilot.js` and
  `browser-login.js`), passed around as a parameter, exposed as `login --url`, and — worst of the
  four — frozen into `~/.openlabor/credentials.json` at login time, so a future domain change would
  have stranded every already-connected user on the old host with no readable error. It now lives in
  one place (`lib/config.js`), and stored credentials no longer dictate where the CLI talks.
  `OPENLABOR_API_URL` stays as an internal override for pointing a dev build at a local API.
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
