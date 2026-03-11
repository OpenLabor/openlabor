<p align="center">
  <a href="https://labor.so">
    <img src="https://labor.so/images/og.png" alt="OpenLabor" width="100%">
  </a>
</p>

<h1 align="center">OpenLabor</h1>

<p align="center">
  <strong>Open source employees, skills, and missions for the AI workforce.</strong>
  <br>
  This is where AI employees are defined. Everything here is a Markdown file — no code required.
</p>

<p align="center">
  <a href="#employees">Employees</a> &bull;
  <a href="#skills">Skills</a> &bull;
  <a href="#missions">Missions</a> &bull;
  <a href="#contributing">Contributing</a>
</p>

---

## What is OpenLabor?

Most AI tools give you a personal assistant — a chatbot that answers your questions. OpenLabor is different. We build **AI employees** — agents with a role, a personality, specialized skills, and recurring missions. They don't wait for you to ask. They work on a schedule, connect to your platforms, and get things done.

An AI employee is not a prompt. It's a complete worker defined by three things:
- **Who they are** — a role with personality, behavior guidelines, and boundaries
- **What they can do** — specialized skills with workflows, scoring frameworks, and APIs
- **What they do on autopilot** — scheduled missions that run every day or every week

### What they actually do

These aren't toy demos. Here's a sample of real missions:

| Mission | Role | Schedule | What happens |
|---------|------|----------|-------------|
| **Daily Outbound Prospecting** | SDR | Every morning | Researches prospects, writes personalized cold emails, schedules follow-ups |
| **Daily Code Review Sweep** | CTO | Every morning | Reviews all open PRs for bugs, security issues, and style violations |
| **Campaign Performance Review** | CMO | Weekly | Pulls data from all campaigns, ranks by ROI, drafts executive summary |
| **Pipeline Follow-Up Sweep** | SDR | Daily | Re-engages stale deals with fresh intel and personalized outreach |
| **Brand Mention Monitor** | CMO | Every 6 hours | Scans social platforms for mentions, categorizes sentiment, drafts responses |
| **Weekly Security Audit** | CTO | Weekly | Scans codebase for vulnerabilities, checks dependencies, reports findings |

### Available roles

| Role | Department | What they do |
|------|-----------|-------------|
| **CTO** | Engineering | Code review, architecture, deployments, security audits, technical docs |
| **CMO** | Marketing | Social media, email campaigns, SEO, content strategy, brand management |
| **SDR** | Sales | Cold outreach, lead qualification, pipeline management, follow-up sequences |
| **Support** | Customer Success | Ticket handling, FAQ automation, customer onboarding, escalation management |
| **Writer** | Content | Blog posts, newsletters, social copy, landing pages, case studies |
| **Designer** | Design | UI/UX, brand assets, social graphics, presentations |
| **Data Analyst** | Data | Reporting dashboards, market research, business intelligence |
| **COO** | Operations | Workflow automation, process optimization, KPI tracking |

---

## Labor.so — the cloud platform

Don't want to set anything up? **[Labor.so](https://labor.so)** is the managed cloud version of OpenLabor.

- **Hire from the catalog** — pick a role, give them a name, they're ready in seconds
- **Plug in any skill** — browse community skills and activate them in one click
- **Assign missions** — set recurring tasks with a schedule and let them run
- **Connect platforms** — Telegram, Slack, WhatsApp, Discord, email — all built in
- **Usage-based pricing** — pay per credit, start free, scale as you grow

We manage the infrastructure, the AI orchestration, the platform connections, and the billing. You just hire and put them to work.

**[Try it free at labor.so](https://labor.so)**

---

## Repository Structure

```
employees/          Who they are — role, personality, behavior
  cto/EMPLOYEE.md
  cmo/EMPLOYEE.md
  sdr/EMPLOYEE.md
  support/EMPLOYEE.md
  writer/EMPLOYEE.md

skills/             What they can do — workflows, APIs, scoring frameworks
  domain-advisor/SKILL.md

missions/           What they do on autopilot — scheduled recurring tasks
  daily-social-content/MISSION.md
  daily-outbound-prospecting/MISSION.md
  daily-code-review/MISSION.md
  campaign-performance-review/MISSION.md
```

---

## Employees

An `EMPLOYEE.md` defines who an AI employee is — their role, personality, core skills, behavior guidelines, and boundaries. This is their identity.

| Role | Department | File |
|------|-----------|------|
| **CTO** | Engineering | [`employees/cto/EMPLOYEE.md`](employees/cto/EMPLOYEE.md) |
| **CMO** | Marketing | [`employees/cmo/EMPLOYEE.md`](employees/cmo/EMPLOYEE.md) |
| **SDR** | Sales | [`employees/sdr/EMPLOYEE.md`](employees/sdr/EMPLOYEE.md) |
| **Support** | Customer Success | [`employees/support/EMPLOYEE.md`](employees/support/EMPLOYEE.md) |
| **Writer** | Content | [`employees/writer/EMPLOYEE.md`](employees/writer/EMPLOYEE.md) |

**Example** — from the CMO employee:

```markdown
You are {{name}}, a CMO AI employee.

## Personality
You are a creative, data-driven marketing leader. You balance brand
storytelling with measurable results.

## Behavior Guidelines
- Lead with the benefit, not the feature
- Always suggest A/B testing for major campaigns
- Provide ready-to-publish copy when asked, not just outlines
```

> Want to add a new role? See [Contributing](#add-a-new-employee) below.

---

## Skills

A `SKILL.md` gives an employee a specialized capability. Skills include triggers (keywords that activate them), step-by-step workflows, scoring frameworks, and optional API integrations.

| Skill | Description | File |
|-------|-------------|------|
| **Domain Advisor** | Find, check, and evaluate domain names with weighted scoring across 7 dimensions | [`skills/domain-advisor/SKILL.md`](skills/domain-advisor/SKILL.md) |

**Example** — from the Domain Advisor skill:

```markdown
---
name: domain-advisor
triggers: ["check domain", "find domain", "suggest domain"]
---

# Domain Advisor

## Workflow
1. Parse input for domain names or business description
2. Check availability via API
3. Score on memorability, length, SEO, brandability...
4. Rank and present with reasoning
```

Skills work with any AI agent that supports structured prompts — Claude, ChatGPT, Cursor, and more.

> Want to build a skill? See [Contributing](#add-a-new-skill) below.

---

## Missions

A `MISSION.md` defines a recurring task that runs on a schedule. Missions are the real work — things your AI employees do automatically, every day or every week.

| Mission | Role | Schedule | File |
|---------|------|----------|------|
| **Daily Social Content Engine** | CMO | Daily 9 AM | [`missions/daily-social-content/MISSION.md`](missions/daily-social-content/MISSION.md) |
| **Daily Outbound Prospecting** | SDR | Daily 9 AM | [`missions/daily-outbound-prospecting/MISSION.md`](missions/daily-outbound-prospecting/MISSION.md) |
| **Daily Code Review Sweep** | CTO | Daily 9 AM | [`missions/daily-code-review/MISSION.md`](missions/daily-code-review/MISSION.md) |
| **Campaign Performance Review** | CMO | Weekly Monday | [`missions/campaign-performance-review/MISSION.md`](missions/campaign-performance-review/MISSION.md) |

**Example** — from the Daily Code Review mission:

```markdown
---
name: Daily Code Review Sweep
role: CTO
schedule: Daily at 9:00 AM
estimatedCredits: 12
---

## Steps
1. Scan all open pull requests
2. Review for bugs, logic errors, and edge cases
3. Run security audit for vulnerabilities
4. Verify coding standards compliance
5. Post review comments and generate summary
```

> Want to add a mission? See [Contributing](#add-a-new-mission) below.

---

## Contributing

Every employee, skill, and mission is a Markdown file. No code required to contribute.

### Add a new employee

1. Fork this repo
2. Create `employees/your-role/EMPLOYEE.md`
3. Include: personality, core skills, behavior guidelines, boundaries
4. Submit a PR

### Add a new skill

1. Create `skills/your-skill-name/SKILL.md`
2. Include: frontmatter (name, triggers), workflow steps, examples
3. Optionally include API endpoints or scoring frameworks
4. Test with any AI agent, then submit a PR

### Add a new mission

1. Create `missions/your-mission-name/MISSION.md`
2. Include: frontmatter (name, role, schedule, estimatedCredits, tags), steps, prompt
3. Submit a PR

### Improve existing files

Found a better personality prompt? A missing behavior guideline? A more efficient workflow? PRs welcome. Open an issue first if the change is significant.

### Ideas for contributions

**Employees:**
- HR Manager, Product Manager, Recruiter, CFO, Legal Counsel

**Skills:**
- SEO Auditor — analyze URLs for SEO issues and opportunities
- Competitor Analyzer — research and compare competitors
- Pricing Advisor — evaluate SaaS pricing strategies
- Brand Name Generator — brainstorm and score company names
- Tech Stack Advisor — recommend stacks based on requirements

**Missions:**
- Weekly Newsletter — curate and write a weekly industry digest
- Customer Feedback Digest — summarize support tickets into product insights
- Monthly Financial Summary — compile revenue, expenses, and runway report
- Weekly Hiring Pipeline — screen applicants and schedule interviews

No contribution is too small. Fix a typo. Add a step to a mission. Suggest a trigger for a skill.

---

## Built on OpenClaw

OpenLabor is powered by **[OpenClaw](https://openclaw.com)** — the open source AI agent engine. OpenClaw handles agent orchestration, multi-channel messaging (Telegram, Slack, WhatsApp, Discord, email), scheduled task execution, and real-time streaming. It's what makes it possible to give each AI employee persistent memory, platform connections, and the ability to run missions autonomously.

If you're building AI agents, OpenClaw is worth checking out — it's a great project with an active community.

---

## Using these files

**On Labor Cloud** (fastest) — deploy AI employees instantly at [labor.so](https://labor.so).

**Copy and paste** — grab any `.md` file and add it to your AI agent's system prompt.

**Reference directly** — point your agent to the raw GitHub URL.

---

## License

MIT — use these files however you want, commercially or otherwise.

---

<p align="center">
  <a href="https://openlabor.ai">openlabor.ai</a> &bull; <a href="https://labor.so">labor.so</a>
  <br><br>
  <sub>Built by <a href="https://github.com/yoanndefay">@yoanndefay</a> and the open source community</sub>
</p>
