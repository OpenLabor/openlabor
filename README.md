<p align="center">
  <h1 align="center">OpenLabor</h1>
  <p align="center">Open source skills, tools, and resources for the AI workforce</p>
</p>

<p align="center">
  <a href="https://openlabor.ai">OpenLabor</a> &middot;
  <a href="https://labor.so">Labor Cloud</a> &middot;
  <a href="#skills">Skills</a> &middot;
  <a href="#contributing">Contributing</a> &middot;
  <a href="https://github.com/OpenLabor/community/issues">Issues</a>
</p>

---

## What is OpenLabor?

**[OpenLabor](https://openlabor.ai)** is the open source community powering the AI workforce. This repo contains skills, templates, and resources that anyone can use, improve, or build on.

**[Labor](https://labor.so)** is the commercial platform — deploy AI employees instantly with zero setup. If you want to try skills in production right now, [sign up at labor.so](https://labor.so).

| | OpenLabor | Labor Cloud |
|---|---|---|
| **What** | Open source skills, tools, resources | Managed AI workforce platform |
| **For** | Developers, contributors, tinkerers | Teams and businesses |
| **Where** | [openlabor.ai](https://openlabor.ai) / [GitHub](https://github.com/OpenLabor) | [labor.so](https://labor.so) |
| **Price** | Free, MIT licensed | Usage-based pricing |

## Repository Structure

```
skills/           AI-powered skills for agents and automation
docs/             Guides, references, and how-tos
templates/        Starter configs and boilerplates
examples/         Usage examples and integration demos
```

## Skills

Skills are structured instructions that give AI agents specialized capabilities. They include workflows, scoring frameworks, API integrations, and decision logic — turning a general-purpose AI into a domain expert.

| Skill | Description | API |
|-------|-------------|-----|
| [Domain Advisor](skills/domain-advisor/) | Find, check, and evaluate domain names with weighted business scoring across 7 dimensions | [domain-checker.openlabor.workers.dev](https://domain-checker.openlabor.workers.dev) |

> More skills coming soon. Want to build one? See [Contributing](#contributing) below.
>
> Want to use skills instantly without setup? Try them on **[labor.so](https://labor.so)**.

### How Skills Work

Each skill is a `SKILL.md` file containing:

- **Triggers** — keywords that activate the skill automatically
- **Workflow** — step-by-step instructions the AI follows
- **Scoring/Analysis** — frameworks for evaluation and ranking
- **API integrations** — endpoints the skill calls for real-time data
- **Examples** — sample inputs and expected outputs

Skills work with any AI agent that supports structured prompts — Claude Code, ChatGPT, Cursor, and more.

### Using a Skill

**Option 1: Labor Cloud** (fastest)
Use skills instantly on [labor.so](https://labor.so) — no setup, no configuration, just results.

**Option 2: Copy and paste**
Grab the `SKILL.md` content and add it to your AI agent's system prompt or instructions.

**Option 3: Claude Code (with OMC)**
Drop the skill folder into `~/.claude/skills/omc-learned/` and it activates automatically on trigger keywords.

**Option 4: Reference directly**
Point your agent to the raw GitHub URL and let it fetch the instructions.

## Contributing

We welcome all contributions — new skills, improvements to existing ones, docs, examples, and ideas.

### Adding a New Skill

1. **Fork** this repo
2. **Create** `skills/your-skill-name/SKILL.md`
3. **Follow** the skill format:

```yaml
---
name: your-skill-name
description: One-line description of what it does
triggers:
  - "keyword one"
  - "keyword two"
argument-hint: "<expected input>"
---

# Skill Name

## Purpose
What does this skill do and why is it useful?

## Workflow
Step-by-step instructions for the AI agent.

## Examples
Sample usage with expected output.
```

4. **Test** your skill with an AI agent to verify it works
5. **Submit** a pull request

### Improving Existing Skills

Found a better scoring framework? A missing edge case? An API that could enhance a skill? PRs are welcome. Open an issue first if the change is significant.

### Ideas for Skills

Not sure what to build? Here are some ideas:

- **Brand Name Generator** — brainstorm and evaluate company/product names
- **Competitor Analyzer** — research and compare competitors from public data
- **SEO Auditor** — analyze a URL for SEO issues and opportunities
- **Pricing Advisor** — evaluate SaaS pricing strategies
- **Tech Stack Advisor** — recommend tech stacks based on requirements
- **Launch Checklist** — pre-launch validation for products and features

## License

MIT — use these skills however you want, commercially or otherwise.

---

<p align="center">
  <a href="https://openlabor.ai">openlabor.ai</a> &middot; <a href="https://labor.so">labor.so</a>
  <br>
  Built by <a href="https://labor.so">Labor</a> and the open source community
</p>
