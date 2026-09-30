---
name: OpenLabor
description: Pilot your OpenLabor AI employees from the terminal — talk to them, move files in and out of their workspace, schedule their work
triggers:
  - /openlabor
---

# OpenLabor — Pilot Your AI Team

You have access to the user's OpenLabor AI employees via the `openlabor` CLI (3.1+). Each employee is a real AI agent running on the platform with its own workspace, skills and tools. Check the login first with `openlabor whoami`; if it fails, ask the user to run `openlabor login`.

Set `OPENLABOR_JSON=1` whenever you need to read the result: every team command then prints exactly one JSON object on stdout (`{"ok":false,"error":…}` and exit 1 on failure).

## Talk to them

```bash
openlabor team                                   # who works here (NAME, ROLE, ID)
openlabor ask "Draft 3 tweet threads about our launch"   # auto-routes, NEW conversation
openlabor ask cto "Review the auth module"               # a specific employee
openlabor chat "Make the second one more casual"         # CONTINUE the last conversation
openlabor chat cto "What about rate limiting?"
openlabor ask cmo "Summarise this deck" --attach deck.pdf  # send files with a message
openlabor history [employee]
```

- `ask` always starts a new conversation; `chat` always continues the latest one.
- The reply is the whole answer; read it and summarise it for the user.

## Files in their workspace

```bash
openlabor ls cmo [dir]                           # list their folder
openlabor upload cmo ./brief.md --dir research   # → cmo/research/brief.md
openlabor upload cmo ./assets                    # a whole folder (paths inside it are kept)
openlabor upload --shared ./pricing.pdf          # shared/, read by every employee
openlabor download cmo                           # their folder as a zip
openlabor mv cmo research/brief.md archive/      # move (trailing /) or rename
openlabor rm cmo research/brief.md               # one file, never a folder
```

- A single file keeps its NAME only; use `--dir` to choose the subfolder.
- Existing files are skipped unless `--overwrite`. Persona files at the root of an employee's folder (`SOUL.md`, `MEMORY.md`, …) are never uploaded: those are edited in the dashboard.
- `ls`, `mv`, `rm` take `--shared` instead of an employee.

## Scheduled work

```bash
openlabor tasks cmo
openlabor tasks create cmo "Weekly recap" --schedule "Weekly, Monday at 9:00 AM" --prompt "Recap last week's metrics"
openlabor tasks toggle <task-id>                 # pause / resume
openlabor tasks rm <task-id>
openlabor run <task-id>                          # run now
```

`--schedule` takes "Daily at 9:00 AM", "Weekly, Monday at 9:00 AM", "Every 30 minutes" (15 minutes minimum) or a 5-field cron.

## Building the team

```bash
openlabor hire                                   # roles you can hire
openlabor hire cmo "Madison"
openlabor skill catalog                          # every skill in the workspace
openlabor skill list cmo                         # what one employee has
openlabor skill install cmo <skill-id>
openlabor skill remove cmo <skill>
openlabor skill create "Churn review" --file churn.md --for cmo
openlabor context                                # the company brief
openlabor wiki / wiki read <slug> / wiki search "<query>"
openlabor wiki write <slug> --file page.md       # REPLACES the page
```

## Rules

- Hiring, `context set` and `wiki write` change the user's company: confirm with the user before running them.
- `wiki write` and `context set` replace, never merge — read first, send the merged text.
- Prefer `upload --shared` for documents every employee should read, and an employee's folder for work that is theirs.
