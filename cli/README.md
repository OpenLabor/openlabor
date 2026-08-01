# @openlabor/cli

Pilot the AI employees working in your OpenLabor workspace, and copy OpenLabor's prompt catalog into Claude Code, Cursor, Codex, OpenCode, or Windsurf.

**15 roles** across 8 departments. **26 skills** with full workflows. **35 missions** on autopilot.

## Install

```bash
npm install -g @openlabor/cli
```

Or use directly:

```bash
npx @openlabor/cli team
```

Both `openlabor` and the shorthand `ol` are installed.

---

## Pilot your team (requires account)

Chat with your AI employees running on [OpenLabor](https://openlabor.ai). They execute work on the platform — the CLI is a remote control.

```bash
openlabor login
openlabor team
openlabor ask "Draft 3 tweet threads about our launch"
openlabor chat "Make the second one more casual"
openlabor ask cto "Review our auth module"
openlabor history
```

`openlabor login` with no argument opens your browser: approve a short code in the dashboard and the CLI receives a **workspace** key. You can still paste one by hand with `openlabor login --key <api-key>` — but the settings page lists both workspace and per-employee keys, and an employee key is rejected on org-wide commands like `team`.

### Pilot commands

| Command | What it does |
|---------|-------------|
| `openlabor login` | Sign in through your browser |
| `openlabor login --key <api-key>` | Sign in with a workspace API key instead |
| `openlabor logout` | Clear credentials |
| `openlabor whoami` | Show current login (validated against the server) |
| `openlabor team` | List your live employees |
| `openlabor ask "message"` | Auto-routes to best employee, new conversation |
| `openlabor ask <employee> "message"` | New conversation with specific employee |
| `openlabor chat "message"` | Continue last conversation |
| `openlabor chat <employee> "message"` | Continue with specific employee |
| `openlabor history` | List all conversations |
| `openlabor history <employee>` | List employee's conversations |
| `openlabor upload <employee> <file-or-dir>` | Send documents or assets into their workspace |
| `openlabor download <employee> [dest.zip]` | Pull their whole workspace as a zip |
| `openlabor tasks <employee>` | List scheduled tasks |
| `openlabor run <task-id>` | Run a scheduled task now |

`upload` skips the files OpenLabor generates (`SOUL.md`, `AGENTS.md`, …) so an import can never overwrite who an employee is, and refuses to replace existing files unless you pass `--overwrite`.

### How it works

```
Your terminal                        OpenLabor platform
┌──────────────┐                    ┌───────────────────┐
│ openlabor    │   X-API-Key auth   │ Your org          │
│ ask          │ ──────────────────>│                   │
│ madison      │                    │ Madison (CMO)     │
│ "write       │                    │  ├─ skills        │
│  tweets"     │    employee reply  │  ├─ tools         │
│              │ <──────────────────│  └─ runs on       │
└──────────────┘                    │     OpenClaw      │
                                    └───────────────────┘
```

The CLI sends messages to your employees via the OpenLabor API. They reply using their skills, tools, and API credentials — all configured on the platform.

### JSON output

For AI tool integrations, set `OPENLABOR_JSON=1` for structured JSON — on failures too, so a caller can branch:

```bash
OPENLABOR_JSON=1 openlabor ask madison "Write tweets"
OPENLABOR_JSON=1 openlabor whoami
# {"ok":true,"logged_in":true,"api":"https://api.openlabor.ai","org_id":"org_xxx","org_name":"Acme"}
```

Colours are dropped automatically when output is piped, and when `NO_COLOR` is set.

### Pointing at another API

There is one production API and it is not a setting. For local development, set `OPENLABOR_API_URL` before running a command.

---

## Try prompts for free (no account needed)

Browse and install AI employee personas and skill workflows as local prompts. Works with any coding tool. These commands hire nobody — they write a Markdown file into your editor.

```bash
openlabor list roles                        # browse 15 role prompts
openlabor list skills                       # browse 26 skills
openlabor search "logo"                     # search across both
openlabor install skill logo-maker          # auto-detects your tool
openlabor install role cto                  # install an AI persona
```

`list employees` and `install employee` still work as aliases.

### What gets installed

When you run `openlabor install`, a Markdown file is copied into your coding tool's config directory. This gives your AI assistant the role's personality or the skill's step-by-step workflow as a local prompt.

This is **not** the same as piloting — the employee doesn't actually run on the platform. It's a way to try OpenLabor workflows for free before signing up.

### Multi-tool support

```bash
openlabor install skill logo-maker                    # auto-detect
openlabor install skill logo-maker --target claude    # .claude/commands/
openlabor install skill logo-maker --target cursor    # .cursor/rules/
openlabor install skill logo-maker --target codex     # codex.md
openlabor install skill logo-maker --target opencode  # opencode.md
openlabor install skill logo-maker --target windsurf  # .windsurfrules
```

### Claude Code — full install

Install all skills at once as slash commands:

```bash
git clone https://github.com/OpenLabor/openlabor.git ~/.claude/skills/openlabor
```

---

## Updates & config

```bash
openlabor version                   # show version and install info
openlabor update                    # upgrade the CLI itself
openlabor prompts outdated          # prompt files you installed that are behind
openlabor prompts refresh           # re-install them at the current version
openlabor config auto_upgrade true  # automatic upgrades
```

`outdated` and `update-skills` still work as aliases for the two `prompts` commands.

Config lives at `~/.openlabor/config.yaml`:

```yaml
auto_upgrade: false
default_target: claude  # editor to install prompts into
```

---

## Available skills

| Category | Skills |
|----------|--------|
| **Content Creation** | Image Generator, Video Generator, Logo Maker, Animate Story |
| **Social Media** | Instagram, LinkedIn, Reddit, YouTube, X Strategy |
| **Sales** | Cold Outreach, Lead Qualification, Web Research |
| **Marketing** | SEO Optimization, Marketing Psychology, Competitor Analysis |
| **Productivity** | Airtable Manager, Google Calendar, Stripe Manager |
| **Analytics** | Data Analyst, Content Summarizer |

## Available roles

| Role | Name | Department |
|------|------|-----------|
| **CTO** | Travis | Engineering |
| **CMO** | Madison | Marketing |
| **SDR** | Hunter | Sales |
| **Designer** | Daisy | Design |
| **Content Writer** | Penelope | Content |
| **Data Analyst** | Derek | Data |
| **Logo Designer** | Logan | Design |
| **Accountant** | Penny | Finance |
| ... and 7 more | | |

## Links

- [GitHub](https://github.com/OpenLabor/openlabor)
- [All employees](https://github.com/OpenLabor/openlabor/tree/main/employees)
- [All skills](https://github.com/OpenLabor/openlabor/tree/main/skills)
- [All missions](https://github.com/OpenLabor/openlabor/tree/main/missions)

## License

MIT
