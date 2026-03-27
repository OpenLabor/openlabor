# @openlabor/cli

Install open source AI employees and skills into Claude Code, Cursor, Codex, OpenCode, and Windsurf.

**15 employees** across 8 departments. **25+ skills** with full workflows. **35 missions** on autopilot.

## Install

```bash
npx @openlabor/cli list skills
```

Or install globally:

```bash
npm install -g @openlabor/cli
openlabor list skills
```

## Commands

```bash
openlabor list employees                    # browse 15 AI employees
openlabor list skills                       # browse 25+ skills
openlabor search "logo"                     # search across both
openlabor install skill logo-maker          # auto-detects your tool
openlabor install employee cto              # install an AI persona
openlabor targets                           # list supported targets
```

## Multi-tool support

```bash
openlabor install skill logo-maker                    # auto-detect
openlabor install skill logo-maker --target claude    # .claude/commands/
openlabor install skill logo-maker --target cursor    # .cursor/rules/
openlabor install skill logo-maker --target codex     # codex.md
openlabor install skill logo-maker --target opencode  # opencode.md
openlabor install skill logo-maker --target windsurf  # .windsurfrules
```

## Updates

```bash
openlabor update                    # upgrade to latest
openlabor outdated                  # list stale skills
openlabor update-skills             # re-install all to latest
openlabor config auto_upgrade true  # automatic upgrades
```

## Claude Code — full install

For Claude Code, you can install all skills at once:

```bash
git clone https://github.com/OpenLabor/openlabor.git ~/.claude/skills/openlabor
```

All skills become available as `/slash-commands`.

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
