# Contributing

New skills, missions and employees are welcome. Everything here is Markdown, so a
contribution is a file, not a build.

## Add a skill

1. Create `skills/<slug>/SKILL.md`. The slug is lowercase, hyphenated, and is what
   people will type: `openlabor install skill <slug>`.
2. Write the frontmatter:

```yaml
---
name: cold-outreach
description: One line. What it does and for whom. This is what shows in the catalog.
category: Sales
triggers:
  - "cold email"
  - "outreach sequence"
---
```

   `category` must match one that already exists, or it splits the catalog: Agent
   Intelligence, Analytics, Content Creation, Design, Finance, Marketing,
   Productivity, Research, Sales, Social Media, Strategy.

3. Write the workflow. A skill is not a prompt. It is the steps, in order, with:
   - the actual API calls, endpoints and parameters
   - how to choose between options — a scoring rule, not "pick the best one"
   - at least one worked example with real input and real output
   - what to do when it fails

4. Regenerate the catalog so the CLI sees it:

```bash
node cli/scripts/generate-registry.js
```

## Add a mission

Same shape, in `missions/<slug>/MISSION.md`, plus a schedule. A mission is work that
runs whether anyone asks or not, so say plainly what it produces and where it puts it.

## Add an employee

`employees/<slug>/EMPLOYEE.md`:

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
---
```

Then the body: how they behave, what they decide alone, and what they escalate. The
boundaries matter more than the personality — an employee that does not know when to
stop is worse than no employee.

## What gets rejected

- A skill that is one paragraph of instructions. That is a prompt, not a workflow.
- A skill with no failure cases. Everything fails; say how.
- Anything that hardcodes a secret, a key or a personal account.
- Anything that only works with a service nobody can sign up for.

## Working on the CLI

```bash
cd cli
node bin/openlabor.js list roles      # runs against the repo catalog directly
npm run gen:registry                  # after adding a skill or employee
npm run bundle:catalog                # what `prepack` does before publishing
```

`cli/catalog/` is generated and gitignored. Do not commit it.

## Licence

By contributing you agree your work ships under the MIT licence in [LICENSE](LICENSE).
