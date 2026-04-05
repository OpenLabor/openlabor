---
name: Meeting Action Extractor
description: "Extract decisions, action items, owners, deadlines, and follow-ups from meeting transcripts — structured output for project tracking"
category: Productivity
roles:
  - email-secretary
  - coo
  - cmo
  - analyst
triggers:
  - "meeting notes"
  - "extract actions"
  - "meeting summary"
  - "action items from"
  - "what was decided"
---

<!-- openlabor-connector: airtable, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

No connector required for core functionality — this skill performs pure LLM analysis of pasted transcripts. The Airtable connector above is optional and only activated if the user wants to push action items to a tracking base.

## Purpose

Paste a meeting transcript from any source (Zoom, Google Meet, Otter.ai, manual notes) and receive structured output: decisions, action items with owners and deadlines, open questions, key insights, implicit commitments, and follow-ups needed.

---

## Step 1: Ingest Transcript

Accept input in any format:
- Pasted text (raw or formatted)
- Meeting notes with timestamps
- Auto-generated transcripts (Zoom, Otter.ai, Google Meet)
- Informal notes or bullet points

If the transcript is too short or vague to extract meaningful content, say so clearly — do not fabricate items.

---

## Step 2: Extract Intelligence

Parse the transcript and extract 6 categories:

### 1. Decisions Made
For each decision:
- What was decided
- Who made the call
- Context (what was discussed before the decision)
- Confidence: High (explicit statement) / Medium (implicit agreement) / Low (assumed from lack of objection)

### 2. Action Items
For each action:
- Task description (specific, actionable)
- Owner (who's responsible — extract from "I'll do X" or "John, can you X")
- Deadline (explicit date, or inferred: "by next week", "before the launch")
- Priority: P0 (blocking) / P1 (important) / P2 (nice to have)
- Dependencies (does this need something else to happen first?)

### 3. Open Questions
Unresolved items that need follow-up:
- The question
- Who raised it
- Who should answer
- Suggested deadline for resolution

### 4. Key Insights
Important information shared during the meeting:
- The insight
- Who shared it
- Relevance (why it matters)

### 5. Implicit Commitments
Things people said they'd do that weren't formally assigned:
- "I was thinking about doing X" → potential commitment
- "We should probably X" → unassigned action
- Flag these separately — they need explicit confirmation from the owner

### 6. Follow-Up Meetings Needed
- Topic
- Suggested attendees
- Suggested timeframe
- Why it's needed

---

## Step 3: Confidence Scoring

For each extracted item, assign a confidence score:
- **High (90%+)**: Explicit statement — "John will send the report by Friday"
- **Medium (60-89%)**: Implied from context — discussed at length, seemed agreed
- **Low (30-59%)**: Inferred — mentioned briefly, no explicit confirmation

Flag anything below 60% with ⚠️ for human verification.

---

## Step 4: Output Format

```
## Meeting Summary: [Title/Date]
**Attendees:** [extracted names]
**Duration:** [if timestamps present]

### Decisions (X items)
| # | Decision | Made By | Confidence |
|---|----------|---------|------------|
| 1 | ... | ... | High ✅ |

### Action Items (X items)
| # | Task | Owner | Deadline | Priority | Status |
|---|------|-------|----------|----------|--------|
| 1 | ... | ... | Apr 10 | P1 | Pending |

### Open Questions (X items)
| # | Question | Raised By | Answer From | Deadline |
|---|----------|-----------|-------------|----------|

### Key Insights
- [insight 1 — who shared it]
- [insight 2]

### Implicit Commitments ⚠️
- [commitment — needs confirmation from owner]

### Follow-Up Meetings
- [Topic] — [attendees] — [timeframe]
```

---

## Step 5: Push to Airtable (Optional)

If the user wants to track action items in Airtable:

```
use airtable AIRTABLE_CREATE_RECORDS '{"baseId":"appXXX","tableIdOrName":"Action Items","records":[{"fields":{"Task":"...","Owner":"...","Deadline":"...","Priority":"P1","Status":"Pending","Source Meeting":"[date]"}}]}'
```

Ask the user for their Airtable base ID and table name if not already configured.

---

## Step 6: Follow-Up Email Draft

Generate a follow-up email summarizing:
- What was decided
- Who's doing what by when
- Open items that need resolution
- Next meeting (if any)

Tone: professional, concise, bullet-point format. Ready to send via Reed (Email Secretary).

---

## Transcript Handling Tips

- Auto-generated transcripts have speaker labels — use them for owner assignment
- If no speaker labels are present, ask the user to clarify who said what for ambiguous ownership
- Handle multiple meetings in batch if provided
- Ignore small talk, pleasantries, and off-topic discussion — extract only actionable content
- Convert relative dates to absolute ("next Friday" → specific date based on meeting date)
- Group related action items under the decision they stem from where possible

---

## Guidelines

- Never fabricate action items not present in the transcript
- If owner is unclear, mark as "TBD" and flag for human assignment
- If the transcript is too short or vague, say so — do not invent content
- Items below 60% confidence must be flagged with ⚠️ for human verification
- Batch processing is supported — handle multiple transcripts sequentially if provided
