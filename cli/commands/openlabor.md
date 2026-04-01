<!-- Installed from openlabor skill: openlabor | v2.0.0 -->
---
name: OpenLabor
description: Chat with your AI employees from the terminal
triggers:
  - /openlabor
---

# OpenLabor — Pilot Your AI Team

You have access to the user's OpenLabor AI employees via the `openlabor` CLI. Each employee is a real AI agent running on the platform with skills, tools, and API credentials.

## Commands

### Start a new conversation
```bash
# Auto-route to the best employee for the task
openlabor ask "Draft 3 tweet threads about our product launch"

# Or specify an employee
openlabor ask cto "Review the auth module for security issues"
openlabor ask designer "Create a logo for our new project"
```

### Continue a conversation
```bash
# Continues the last conversation automatically
openlabor chat "Make the second tweet more casual"

# Continue with a specific employee
openlabor chat cto "What about rate limiting?"
```

### View conversations
```bash
openlabor history             # list all recent conversations
openlabor history madison     # list conversations with Madison
```

### Other commands
```bash
openlabor team                # list all employees
openlabor tasks madison       # list scheduled tasks
openlabor run <task-id>       # run a scheduled task now
```

## How to Use

When the user asks you to delegate work to an employee:

1. Run `openlabor team` to see available employees and their roles/departments/skills
2. Use `openlabor ask "task description"` to auto-route, or `openlabor ask <employee> "task"` for a specific one
3. Read the reply and summarize it to the user
4. If the user wants changes, use `openlabor chat "follow-up"` to continue the conversation

When the user wants to continue a previous conversation:
- Use `openlabor chat "message"` — it automatically continues the last conversation
- Use `openlabor chat <employee> "message"` to continue with a specific employee

## Auto-Routing

When no employee is specified, `ask` automatically routes to the best employee:
- **Marketing/Social/Tweets** → CMO, X Manager, Social Manager
- **Code/Architecture/Security** → CTO
- **Design/UI/Logo** → Designer
- **Sales/Outreach/Leads** → Sales Rep
- **Content/Blog/Copy** → Content Writer
- **Strategy/Consulting** → Strategic Consultant

## JSON Mode

For structured output, set `OPENLABOR_JSON=1`:
```bash
OPENLABOR_JSON=1 openlabor ask cmo "Write tweets"
```

## Key Rules

- `ask` = always starts a NEW conversation
- `chat` = always CONTINUES the latest conversation
- Both support auto-routing (no employee arg) or specific employee
- The CLI handles session management — no session IDs needed
