<p align="center">
  <img src="https://openlabor.ai/images/og.png" alt="OpenLabor" width="100%">
</p>

<h1 align="center">OpenLabor</h1>

<p align="center">
  <strong>Open source AI employees. Browse, install, and pilot them from Claude Code, Cursor, Codex, and more.</strong>
</p>

<p align="center">
  <a href="https://github.com/OpenLabor/openlabor/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License MIT"></a>
  <a href="https://www.npmjs.com/package/@openlabor/cli"><img src="https://img.shields.io/npm/v/@openlabor/cli.svg" alt="npm"></a>
  <a href="https://x.com/openlaborai"><img src="https://img.shields.io/badge/X-@openlaborai-black.svg?logo=x" alt="X"></a>
</p>

---

## Two ways to use OpenLabor

| | Pilot (account required) | Install (free, no account) |
|---|---|---|
| **What** | Chat with AI employees running on the platform | Copy skill workflows and employee personas into your coding tool as local prompts |
| **How** | `openlabor ask madison "task"` | `openlabor install skill logo-maker` |
| **Runs where** | On the OpenLabor platform (powered by OpenClaw) | Locally in your coding tool |
| **Needs account** | Yes — API key from your dashboard | No |
| **Employee actually works** | Yes — uses tools, APIs, skills, produces real output | No — your coding tool roleplays the persona |
| **Best for** | Teams using OpenLabor to automate work | Developers trying workflows before signing up |

---

## Pilot your team

Chat with your AI employees from the terminal. They run on the platform with all their skills, tools, and API credentials already configured.

```bash
npm install -g @openlabor/cli

# Connect (one-time — get your key from Settings > API Keys)
openlabor login <api-key>

# See who's available
openlabor team

# Send a message (auto-routes to best employee)
openlabor ask "Draft 3 tweet threads about our launch"

# Continue the conversation
openlabor chat "Make the second one more casual"

# Message a specific employee
openlabor ask cto "Review our auth module"

# View conversations
openlabor history
openlabor history madison

# Scheduled tasks
openlabor tasks madison
openlabor run <task-id>
```

Works from any coding tool that can run shell commands — Claude Code, Cursor, Codex, Windsurf, or just your terminal.

---

## Install skills for free

Browse and install employee personas and skill workflows as local prompts. No account needed.

```bash
npx openlabor install skill logo-maker      # works with Claude Code, Cursor, Codex, OpenCode, Windsurf
npx openlabor install employee cto          # install an AI persona
```

Auto-detects your tool. Browse what's available:

```bash
npx openlabor list skills                   # 25+ skills
npx openlabor list employees                # 15 AI employees
npx openlabor search "logo"                 # search across both
```

### Quick start

```
You:    I need a logo for my new project
Claude: [activates /logo-maker — generates concepts with Flux and Imagen]

You:    /seo-optimization
Claude: [analyzes your content, suggests keywords, rewrites meta tags]

You:    /cold-outreach
Claude: [researches prospects, writes personalized emails, schedules follow-ups]
```

Every skill is a complete workflow — not just a prompt, but step-by-step instructions with APIs, scoring frameworks, and examples.

---

## What's inside

### 15 AI Employees

Each employee has a role, personality, behavior guidelines, and boundaries.

| Role | Name | Department | Tagline |
|------|------|-----------|---------|
| **CTO** | Travis | Engineering | Ships code while you sleep |
| **CMO** | Madison | Marketing | Runs your entire marketing engine |
| **SDR** | Hunter | Sales | Books meetings you never could |
| **COO** | Oliver | Operations | Runs ops so you don't have to |
| **X Manager** | Xavier | Marketing | Turns your X into a growth machine |
| **Designer** | Daisy | Design | Designs like it has taste |
| **Content Writer** | Penelope | Content | Writes better than your last hire |
| **Data Analyst** | Derek | Data | Finds the insight you missed |
| **HR Manager** | Holly | HR | Hires faster than recruiters |
| **Logo Designer** | Logan | Design | Crafts logos that stick |
| **Brand Advisor** | Brandon | Marketing | Finds the perfect name before someone else does |
| **Accountant** | Penny | Finance | Your books, always clean |
| **Lead Finder** | Chase | Sales | Fills your pipeline while you sleep |
| **Social Manager** | Sierra | Marketing | Grows your following on autopilot |
| **Email Secretary** | Reed | Operations | Inbox zero, every single day |

### 25+ Skills

Skills give employees specialized capabilities — workflows, APIs, and scoring frameworks.

| Category | Skills |
|----------|--------|
| **Content Creation** | Image Generator, Video Generator, Logo Maker, Animate Story, Content Humanizer |
| **Social Media** | Instagram, LinkedIn, Reddit, YouTube, X Strategy |
| **Sales** | Cold Outreach, Lead Qualification, Web Research |
| **Marketing** | SEO Optimization, Marketing Psychology, Competitor Analysis, News Trends |
| **Productivity** | Airtable Manager, Google Calendar, Stripe Manager |
| **Analytics** | Data Analyst, Content Summarizer |
| **Agent Intelligence** | Prompt Engineering, Self-Improving Agent |

> Browse all skills in [`skills/`](skills/)

### 35 Missions

Missions are recurring tasks that run on a schedule — the real work.

| Category | Examples |
|----------|---------|
| **Marketing** | Daily Social Content Engine, Brand Mention Monitor, Weekly X Analytics |
| **Sales** | Daily Outbound Prospecting, Pipeline Follow-Up Sweep, Lead List Builder |
| **Engineering** | Daily Code Review Sweep, Weekly Security Audit, Dependency Updates |
| **Design** | Weekly Social Graphics Batch, Monthly Brand Consistency Report |
| **Operations** | Daily Inbox Triage, Weekly Ops Dashboard, Calendar Prep |
| **Finance** | Daily Expense Reconciliation, Weekly Cash Flow Forecast |

> Browse all missions in [`missions/`](missions/)

---

## How it works

Everything is a Markdown file. No code required.

```
employees/cto/EMPLOYEE.md     → who Travis is, how he behaves
skills/logo-maker/SKILL.md    → step-by-step logo generation workflow
missions/daily-code-review/   → scheduled task that runs every morning
```

An employee is not a prompt. It's a complete definition:

```yaml
---
id: cto
name: Travis
role: CTO
department: Engineering
tagline: "Ships code while you sleep"
skills:
  - "Code review"
  - "Architecture planning"
  - "Bug fixing"
  - "Security audits"
---
```

A skill is a full workflow:

```yaml
---
name: logo-maker
description: Generate professional logomarks and wordmarks
triggers:
  - "make a logo"
  - "create logo"
  - "design logo"
---

# Step 1: Understand the Brand
# Step 2: Craft the Prompt
# Step 3: Generate with Replicate (Flux)
# Step 4: Generate with Google Imagen
# Step 5: Present and Compare
# Step 6: Refine
```

---

## All commands

```bash
# Pilot (requires account)
openlabor login <api-key>                        # connect to your org
openlabor login <api-key> --url <url>            # connect to self-hosted instance
openlabor logout                                 # clear credentials
openlabor whoami                                 # show current login
openlabor team                                   # list your live employees
openlabor ask "<message>"                        # auto-routes to best employee, new conversation
openlabor ask <employee> "<message>"             # new conversation with specific employee
openlabor chat "<message>"                       # continue last conversation
openlabor chat <employee> "<message>"            # continue with specific employee
openlabor history                                # list all conversations
openlabor history <employee>                     # list employee's conversations
openlabor tasks <employee>                       # list scheduled tasks
openlabor run <task-id>                          # run a scheduled task now

# Install (free, no account)
openlabor list employees                         # browse employees
openlabor list skills                            # browse skills
openlabor search <query>                         # search across both
openlabor install employee <name> [--target t]   # install a persona
openlabor install skill <name> [--target t]      # install a workflow
openlabor targets                                # list supported tools

# Maintenance
openlabor version                                # show version
openlabor update                                 # upgrade CLI
openlabor outdated                               # list stale installs
openlabor update-skills                          # re-install all to latest
openlabor config <key> <value>                   # set config
```

---

## Contributing

Every employee, skill, and mission is a Markdown file. No code required to contribute.

**Add an employee** — create `employees/your-role/EMPLOYEE.md` with personality, skills, behavior guidelines, boundaries.

**Add a skill** — create `skills/your-skill/SKILL.md` with frontmatter, workflow steps, examples, optional API integrations.

**Add a mission** — create `missions/your-mission/MISSION.md` with schedule, role, and prompt.

**Ideas:** Product Manager, Recruiter, CFO, Legal Counsel, Pricing Advisor, Contract Reviewer, Competitor Tracker.

PRs welcome. Open an issue first if the change is significant.

---

## Built on OpenClaw

Powered by **[OpenClaw](https://openclaw.com)** — the open source AI agent engine for orchestration, multi-channel messaging, scheduled tasks, and real-time streaming.

---

## License

MIT — use however you want, commercially or otherwise.

<p align="center">
  <a href="https://openlabor.ai">openlabor.ai</a>
  <br><br>
  <sub>Built by <a href="https://github.com/yoanndefay">@yoanndefay</a> and the open source community</sub>
</p>
