# @openlabor/cli

Browse, install, and **pilot** your OpenLabor AI employees from Claude Code, Cursor, Codex, OpenCode, and Windsurf.

**15 employees** across 8 departments. **25+ skills** with full workflows. **35 missions** on autopilot.

## Install

```bash
npm install -g @openlabor/cli
```

Or use directly:

```bash
npx @openlabor/cli team
```

---

## Pilot your team (requires account)

Chat with your AI employees running on [OpenLabor](https://openlabor.ai). They execute work on the platform — the CLI is a remote control.

**You need:** An OpenLabor account and an API key (get one from **Settings > API Keys** in your dashboard).

```bash
openlabor login <api-key>
openlabor team
openlabor ask "Draft 3 tweet threads about our launch"
openlabor chat "Make the second one more casual"
openlabor ask cto "Review our auth module"
openlabor history
```

### Pilot commands

| Command | What it does |
|---------|-------------|
| `openlabor login <api-key>` | Connect to your org |
| `openlabor logout` | Clear credentials |
| `openlabor whoami` | Show current login |
| `openlabor team` | List your live employees |
| `openlabor ask "message"` | Auto-routes to best employee, new conversation |
| `openlabor ask <employee> "message"` | New conversation with specific employee |
| `openlabor chat "message"` | Continue last conversation |
| `openlabor chat <employee> "message"` | Continue with specific employee |
| `openlabor history` | List all conversations |
| `openlabor history <employee>` | List employee's conversations |
| `openlabor tasks <employee>` | List scheduled tasks |
| `openlabor run <task-id>` | Run a scheduled task now |

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

For AI tool integrations, set `OPENLABOR_JSON=1` for structured JSON:

```bash
OPENLABOR_JSON=1 openlabor ask madison "Write tweets"
```

### Custom API URL

For self-hosted or local development:

```bash
openlabor login <api-key> --url http://localhost:4001
```

---

## Try skills for free (no account needed)

Browse and install AI employee personas and skill workflows as local prompts. Works with any coding tool.

**You need:** Nothing. Everything is open source.

```bash
openlabor list employees                    # browse 15 AI employees
openlabor list skills                       # browse 25+ skills
openlabor search "logo"                     # search across both
openlabor install skill logo-maker          # auto-detects your tool
openlabor install employee cto              # install an AI persona
```

### What gets installed

When you run `openlabor install`, a Markdown file is copied into your coding tool's config directory. This gives your AI assistant the employee's personality or the skill's step-by-step workflow as a local prompt.

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
openlabor update                    # upgrade to latest
openlabor outdated                  # list stale skills
openlabor update-skills             # re-install all to latest
openlabor config auto_upgrade true  # automatic upgrades
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

## Available employees

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
