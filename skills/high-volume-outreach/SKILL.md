---
name: High Volume Cold Outreach
description: "Execute cold outreach campaigns at scale — 500+ emails/day with Instantly, multi-account rotation, automatic warmup, A/B testing, and campaign analytics"
category: Sales
roles:
  - sdr
  - lead-finder
platforms:
  - instantly
  - hunter
---

<!-- openlabor-connector: instantly, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->
<!-- openlabor-connector: hunter, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# High Volume Cold Outreach

Turn cold prospects into booked meetings at scale — 500+ emails/day using Instantly's multi-account infrastructure, automatic warmup, and campaign analytics. Hunter finds and verifies emails. Instantly delivers them at volume without destroying your domain reputation.

You are a high-volume cold outreach operator. Your job is to build systems that book meetings at scale while keeping deliverability pristine. Volume without deliverability is just spam. Your edge is that you send more AND land in more inboxes.

## Volume vs. Quality — The Real Tradeoff

- Average cold email reply rate at volume (no warmup, no verify): 0.1-0.3% — and it destroys your domain
- High-volume outreach with warmup + verification + segmentation: 3-7% reply rate sustainable for months
- The goal is not just to send more. It's to build infrastructure that can send more safely, forever.
- One bad week — 5%+ bounce rate, 0.2%+ spam complaints — can blacklist your domain permanently

## The Pipeline

```
Pre-Flight  : Account health, warmup scores, inbox placement test, capacity calc
Step 1      : Define — ICP, target accounts, outreach goal
Step 2      : Research — batch research for segments, not individual prospects
Step 3      : Find & Verify — bulk email finding + verification via Hunter
Step 4      : Campaign Setup — lead lists, import, sequence creation, A/B variants
Step 5      : Launch — conservative volume, monitor daily
Step 6      : Scale — week-over-week ramp based on health metrics
Step 7      : Reply Handling — positive, objection, not-now
Step 8      : Weekly Review — analytics, pause/scale decisions, status updates
```

---

## Pre-Flight Checklist

Run this before activating ANY campaign. Do not skip.

### 1. Check Account Health

```
use instantly INSTANTLY_LIST_EMAIL_ACCOUNTS '{}'
```

Review every sending account. For each account, confirm:
- Warmup enabled: `true`
- Warmup score: `≥80` (never send from accounts below this)
- Days since account added: `≥14`
- Sending limit: confirm configured (start at 30/day)

**Hard rule: Never activate a campaign from an account with warmup score <80.**

### 2. Run Inbox Placement Test

```
use instantly INSTANTLY_CREATE_INBOX_PLACEMENT_TEST '{"subject":"[TEST_SUBJECT]","body":"[TEST_BODY_PLAIN_TEXT]"}'
```

Review results for:
- Gmail inbox rate: target 90%+
- Outlook inbox rate: target 85%+
- Spam folder rate: target <5%

If inbox placement is below target, do not launch. Fix deliverability first (see Deliverability section).

### 3. Check Blacklist Status

```
use instantly INSTANTLY_LIST_INBOX_PLACEMENT_BLACKLIST_REPORTS '{}'
```

If any sending domain appears on a blacklist, pause all campaigns from that domain immediately. Investigate bounce rates and spam complaints before any remediation.

### 4. Calculate Daily Capacity

```
accounts_ready = [count of accounts with warmup score ≥80]
conservative_daily_volume = accounts_ready × 30
aggressive_daily_volume = accounts_ready × 50  (only after 1 week of healthy metrics)
```

Example: 10 warmed accounts = 300 emails/day conservative, 500/day after ramp.

---

## Step 1 — Define Your ICP and Target List

Before building a campaign, define who you're targeting with precision.

### Ideal Customer Profile (ICP)

```
Company size: [e.g. 20-200 employees]
Industry: [e.g. SaaS, e-commerce, logistics]
Title: [e.g. Head of Sales, VP Marketing, Founder]
Geography: [e.g. US, UK, DACH]
Pain signal: [e.g. recently hired SDRs, running ads without tracking, raised Series A]
Disqualifiers: [e.g. already a customer, <5 employees, consumer product]
Segment size: [how many contacts you expect — this drives account capacity planning]
```

### Target List Format

Build or import your list with these fields:

| Field | Required | Instantly Variable |
|-------|----------|--------------------|
| First name | Yes | `{{first_name}}` |
| Last name | Yes | `{{last_name}}` |
| Company | Yes | `{{company_name}}` |
| Company domain | Yes | — (used for Hunter lookup) |
| Job title | Yes | `{{custom_field_title}}` |
| LinkedIn URL | Recommended | `{{custom_field_linkedin}}` |
| Trigger event | Optional | `{{custom_field_trigger}}` |
| Industry | Optional | `{{custom_field_industry}}` |
| Pain signal | Optional | `{{custom_field_pain}}` |

All `{{custom_field_*}}` values are importable into Instantly and usable in sequence copy.

---

## Step 2 — Prospect Research (Batch Mode)

At high volume, you research segments, not individuals. Define 3-5 micro-segments within your ICP and write copy for each segment. Do not write a unique email for every contact.

### Segment Research Process

For each micro-segment (e.g. "VP Sales at Series B SaaS, 50-150 employees"):

```
use search SEARCH '{"query":"[ICP title] challenges [pain area] 2024","max_results":"5"}'
```

```
use search SEARCH '{"query":"[industry] [pain area] statistics benchmark","max_results":"5"}'
```

```
use search SEARCH '{"query":"[competitor] reviews complaints [pain area] site:g2.com OR site:reddit.com","max_results":"5"}'
```

Extract:
- The #1 pain this segment actually talks about (in their words)
- A data point or benchmark that makes the pain concrete
- A proof point (customer result) that maps to this segment
- A trigger pattern common in this segment (e.g. "hiring SDRs" = scaling sales)

### Individual Research (Tier 1 Only)

For top-priority accounts (trigger score 70+ — see scoring below), do individual research:

```
use search SEARCH '{"query":"{{first_name}} {{last_name}} {{company_name}} LinkedIn","max_results":"3"}'
```

```
use search SEARCH '{"query":"{{company_name}} funding OR launch OR hire 2024","max_results":"3"}'
```

### Priority Scoring

| Signal | Points |
|--------|--------|
| Trigger event in last 30 days | +30 |
| Trigger event in last 90 days | +15 |
| Company raised funding (Series A/B) | +25 |
| Job posting for a role that signals pain | +20 |
| Prospect posted on LinkedIn this week | +20 |
| Shared connection or warm intro possible | +15 |
| Competitor customer (G2/Capterra) | +20 |
| ICP match on title + company size + industry | +10 |

**Tier 1 (70+ points)**: Individual research + custom first line. 10-15% of list.
**Tier 2 (40-69 points)**: Segment-level personalization. 50-60% of list.
**Tier 3 (<40 points)**: Role + industry personalization only. Remainder.

---

## Step 3 — Find and Verify Email with Hunter (Bulk)

### Find Email by Name + Domain

```
use hunter HUNTER_EMAIL_FINDER '{"first_name":"{{first_name}}","last_name":"{{last_name}}","domain":"[COMPANY_DOMAIN]"}'
```

### Search All Emails at a Domain

```
use hunter HUNTER_DOMAIN_SEARCH '{"domain":"[COMPANY_DOMAIN]"}'
```

Use for accounts where you have the company but not the contact. Extract email pattern from results and apply it to your full contact list at that domain.

### Verify Before Importing

Always verify every email before importing into Instantly. Unverified emails drive bounces. Bounces destroy warmup scores.

```
use instantly INSTANTLY_VERIFY_EMAIL '{"email":"[EMAIL]"}'
```

Run this for every contact in your list. Do not batch-import unverified emails.

### Enrichment Rules

- **Hunter confidence >70% + Instantly status `valid`**: import
- **Hunter confidence 50-70%**: verify with Instantly first — import only if `valid`
- **Hunter confidence <50%**: skip unless you can verify via other means
- **Instantly status `invalid`**: skip — do not import
- **Instantly status `risky`**: skip at volume — bounce risk is too high
- **Hunter returns no result**: try `HUNTER_DOMAIN_SEARCH` for pattern inference, then construct and verify

**Target: <3% bounce rate across all campaigns. If you're above this, your verification is failing.**

---

## Step 4 — Campaign Setup

### 4a. Create Lead List

```
use instantly INSTANTLY_CREATE_LEAD_LIST '{"name":"[LIST_NAME — include date and segment]"}'
```

Name format: `[Segment] — [Date] — [Campaign Name]` e.g. `VP Sales SaaS Series B — 2024-01 — Pain Campaign`

### 4b. Import Verified Leads with Campaign Assignment

For each verified lead:

```
use instantly INSTANTLY_CREATE_LEAD '{"email":"[EMAIL]","first_name":"{{first_name}}","last_name":"{{last_name}}","company_name":"{{company_name}}","campaign_id":"[CAMPAIGN_ID]","custom_fields":{"title":"[TITLE]","linkedin":"[LINKEDIN_URL]","trigger":"[TRIGGER_EVENT]","industry":"[INDUSTRY]","pain":"[PAIN_SIGNAL]"}}'
```

Import in batches. Confirm lead count matches expected list size before activating.

### 4c. Create Campaign with Sequence

Create the campaign container:

```
use instantly INSTANTLY_CREATE_CAMPAIGN '{"name":"[CAMPAIGN_NAME]","from_accounts":["[ACCOUNT_1_ID]","[ACCOUNT_2_ID]","[ACCOUNT_3_ID]"],"daily_limit":30,"schedule":{"days":["monday","tuesday","wednesday","thursday"],"start_hour":7,"end_hour":11,"timezone":"prospect_local"}}'
```

Notes:
- `from_accounts`: list 3-10 sending accounts for rotation
- `daily_limit`: start at 30/account. Scale after 1 week of healthy metrics.
- `schedule`: Tuesday-Thursday, 7-11am in prospect's local timezone is optimal

### 4d. Create Sequence Steps

Attach subsequences for the full 5-touch cadence. For each step:

```
use instantly INSTANTLY_ACTIVATE_SUBSEQUENCE '{"campaign_id":"[CAMPAIGN_ID]","subject":"[SUBJECT]","body":"[BODY_WITH_VARIABLES]","delay_days":[0,3,6,10,14][step_index],"step_number":[1-5]}'
```

Sequence timing:
| Step | Delay | Angle |
|------|-------|-------|
| 1 | Day 0 | Personalized intro + pain |
| 2 | Day 3 | Value add — insight or data point |
| 3 | Day 6 | Social proof — customer result |
| 4 | Day 10 | Trigger-specific or case study |
| 5 | Day 14 | Break-up email |

### 4e. A/B Test Subject Lines

Create 2 subject line variants for the first email. Instantly splits traffic automatically.

**Variant A** — Trigger/event-based:
```
{{custom_field_trigger}} — quick question
```

**Variant B** — Pain/role-based:
```
{{custom_field_pain}} at {{company_name}}
```

Monitor open rates after 100 sends per variant. Kill the loser. Double down on the winner.

---

## Step 5 — Launch (Conservative)

Before activating any campaign, complete the Pre-Flight checklist above.

Human approval is required before activating any campaign. Present the following summary for approval:

```
Campaign: [NAME]
Leads: [COUNT] (verified: [COUNT], skipped invalid: [COUNT])
Sending accounts: [LIST] (warmup scores: [SCORES])
Daily volume: [X] emails/day ([Y] accounts × 30)
Sequence: 5 touches over 14 days
A/B test: [VARIANT_A_SUBJECT] vs [VARIANT_B_SUBJECT]
Estimated completion: [DATE]
```

After approval:

```
use instantly INSTANTLY_ACTIVATE_SUBSEQUENCE '{"campaign_id":"[CAMPAIGN_ID]"}'
```

Monitor for the first 48 hours. Check daily metrics each morning.

---

## Step 6 — Scaling

### Week 1: Conservative Baseline

- Daily limit: 30 emails/account
- Monitor: bounce rate, reply rate, spam complaints
- Check metrics each morning (see Weekly Review section)
- Do not scale until you have 7 days of clean data

### Scaling Decision Matrix

After Week 1, check:

| Metric | Gate |
|--------|------|
| Bounce rate | <3% to scale |
| Reply rate | >2% (if below, fix copy before scaling volume) |
| Spam complaint rate | 0% (any complaints = pause and investigate) |
| Warmup scores | All accounts ≥80 |
| Inbox placement | ≥85% |

If all gates pass: increase daily limit to 50/account.

```
use instantly INSTANTLY_GET_CAMPAIGN_ANALYTICS '{"campaign_id":"[CAMPAIGN_ID]","start_date":"[7_DAYS_AGO]","end_date":"[TODAY]"}'
```

### Multi-Account Rotation

Spread volume across 3-10 sending accounts. Instantly handles rotation automatically when multiple accounts are assigned to a campaign. Recommended setup:

- 3 accounts: 90 emails/day conservative, 150/day scaled
- 5 accounts: 150 emails/day conservative, 250/day scaled
- 10 accounts: 300 emails/day conservative, 500/day scaled

Each account should be on a different domain (e.g. `getbrand.com`, `trybrand.com`, `brand.io`). Never rotate multiple accounts on the same root domain — a single domain blacklist takes all accounts down.

---

## Email Templates (Instantly Variable Syntax)

All templates use Instantly's variable format: `{{first_name}}`, `{{company_name}}`, `{{custom_field_*}}`.

### Touch 1 — Personalized Intro (Day 0)

**Tier 1 (individual hook):**
```
Hi {{first_name}},

{{custom_field_trigger}} — caught my eye.

[One sentence on the problem you solve, framed for their role and company stage.]

[One sentence proof point — customer result with a number.]

Worth a 15-min call this week?

[Signature]
```

**Tier 2/3 (segment hook):**
```
Hi {{first_name}},

[Segment-specific opener referencing their role + a pain or trend specific to their industry.]

We help {{custom_field_industry}} companies like {{company_name}} [specific outcome]. [Customer] went from [before] to [after] in [timeframe].

Worth 15 minutes to see if there's a fit?

[Signature]
```

---

### Touch 2 — Value Add (Day 3)

```
Hi {{first_name}},

Didn't want to assume timing was off — wanted to share this first.

[One useful data point, benchmark, or insight specific to their industry or role.]

No ask — just thought it was relevant given what {{company_name}} is doing in {{custom_field_industry}}.

Still happy to show you what we're doing with similar teams if the timing works.

[Signature]
```

---

### Touch 3 — Social Proof (Day 6)

```
{{first_name}},

[Customer name], who runs [similar role] at [similar company], had the same challenge with [specific problem].

After [timeframe], they [specific result with a number].

Happy to walk you through exactly how they did it — 15 min?

[Signature]
```

---

### Touch 4 — Trigger / Case Study (Day 10)

```
{{first_name}},

Saw {{custom_field_trigger}} — made me think of you.

We're seeing [pattern] across {{custom_field_industry}} companies at {{company_name}}'s stage. The ones who [action] are getting [result].

[Short specific data point or story.]

Still open to connecting — would this week work?

[Signature]
```

---

### Touch 5 — Break-Up Email (Day 14)

```
{{first_name}},

I'll stop reaching out after this — I know timing isn't always right.

If [the problem you solve] becomes a priority in the next quarter, I'd love to reconnect.

We'll be here.

[Signature]
```

Break-up emails consistently generate the highest reply rate in a sequence. The finality creates urgency. Do not hedge it with a softer close.

---

### Template A — Cold Intro (No Trigger)

```
Hi {{first_name}},

{{company_name}}'s been on my radar — specifically [one thing you noticed about their business or growth].

We help {{custom_field_industry}} companies [specific outcome]. [Customer] went from [before] to [after] in [timeframe].

Worth 15 minutes to see if there's a fit?

[Signature]
```

---

### Template B — Referral / Warm Intro

```
Hi {{first_name}},

[Mutual contact] suggested I reach out — said you're dealing with [problem].

We've helped [similar company] [specific result]. [Mutual contact] thought it might be relevant.

Happy to show you what that looked like — 15 min this week?

[Signature]
```

---

### Template C — Trigger Event (Funding, Hire, Launch)

```
Hi {{first_name}},

Congrats on {{custom_field_trigger}} — [one specific observation about what it signals for their business stage].

Companies at your stage often hit [specific challenge] as they scale. We've helped [customer] avoid that by [how].

Quick call to share what's working?

[Signature]
```

---

### Template D — Pain-Based (Role-Specific)

```
Hi {{first_name}},

[Their title] at companies like {{company_name}} usually tell me {{custom_field_pain}}.

We built [product/feature] specifically for that. [Customer] [specific result].

If that's on your radar, happy to show you in 15 min.

[Signature]
```

---

## Step 7 — Reply Handling

### Check for Replies

```
use instantly INSTANTLY_LIST_EMAIL_THREADS '{"campaign_id":"[CAMPAIGN_ID]","has_reply":true,"limit":50}'
```

```
use instantly INSTANTLY_COUNT_UNREAD_EMAILS '{"campaign_id":"[CAMPAIGN_ID]"}'
```

Run both at the start and end of each working session. Do not let replies sit more than a few hours during business hours.

### Positive Reply

- Respond within 1 hour — speed signals you're serious
- Send your calendar link immediately
- Include a 1-line agenda in the calendar invite
- Before the call: review their LinkedIn, recent news, your email thread
- Update lead status immediately:

```
use instantly INSTANTLY_UPDATE_LEAD_INTEREST_STATUS '{"lead_id":"[LEAD_ID]","interest_status":"interested"}'
```

---

### Objection Handling

| Objection | Response |
|-----------|----------|
| "Not interested" | "Totally fair — out of curiosity, is it timing or not the right fit?" (one reply max) |
| "We have a solution" | "Good to know. Is it solving [specific pain] or mainly [adjacent thing]?" |
| "Send me more info" | Send a one-pager or case study. Follow up in 3 days to confirm receipt. |
| "Talk to [other person]" | "Happy to — can you CC them or give me their email?" |
| "Too expensive" | "Understood. What would need to change for this to make sense in the next 6 months?" |

Update lead status for all objections:

```
use instantly INSTANTLY_UPDATE_LEAD_INTEREST_STATUS '{"lead_id":"[LEAD_ID]","interest_status":"not_interested"}'
```

---

### Not Now — Nurture Path

If prospect is interested but timing is off:

1. Ask: "When would be a better time to reconnect?"
2. Set a calendar reminder for that date
3. At that date: send a short re-activation email referencing this conversation
4. Update status to `nurture`:

```
use instantly INSTANTLY_UPDATE_LEAD_INTEREST_STATUS '{"lead_id":"[LEAD_ID]","interest_status":"nurture"}'
```

Do not re-enroll nurture contacts in cold sequences. They've engaged — treat them accordingly.

---

## Step 8 — Weekly Review

Run every Monday morning before the week's first send.

### Pull Campaign Analytics

```
use instantly INSTANTLY_GET_CAMPAIGN_ANALYTICS '{"campaign_id":"[CAMPAIGN_ID]","start_date":"[7_DAYS_AGO]","end_date":"[TODAY]"}'
```

```
use instantly INSTANTLY_GET_DAILY_CAMPAIGN_ANALYTICS '{"campaign_id":"[CAMPAIGN_ID]","start_date":"[7_DAYS_AGO]","end_date":"[TODAY]"}'
```

Review daily trends. A single bad day (spike in bounces, spam complaints) should trigger an investigation before the next day's sends.

### Per-Account Performance Check

```
use instantly INSTANTLY_LIST_EMAIL_ACCOUNTS '{}'
```

For any account with warmup score drop >10 points week-over-week:
- Pause sends from that account
- Check if it contributed disproportionately to bounces or spam complaints
- Do not resume until warmup score recovers to ≥80

### Scaling Decisions

Based on weekly analytics:
- **Bounce rate <3% + reply rate >3%**: scale daily limit by 10 emails/account
- **Bounce rate 3-5%**: hold volume, investigate list quality
- **Bounce rate >5%**: STOP immediately — pause all campaigns, investigate before any sends
- **Spam complaint rate >0.05%**: pause and review content and targeting

### Winning Variant Consolidation

After 200+ sends per A/B variant:
- Identify the winner (higher open rate + reply rate combined)
- Pause the losing variant
- Update all new campaigns to use the winning subject line pattern

### Update Lead Statuses in Bulk

For leads who have not replied after Touch 5:

```
use instantly INSTANTLY_UPDATE_LEAD_INTEREST_STATUS '{"lead_id":"[LEAD_ID]","interest_status":"no_reply"}'
```

---

## Deliverability Infrastructure

Deliverability is the foundation. Volume means nothing if you land in spam.

### Domain Setup (Per Sending Domain)

Before adding any domain to Instantly:

**SPF record** (DNS TXT on sending domain):
```
v=spf1 include:sendingdomain.com ~all
```

**DKIM** (set up via Instantly's domain settings — generates the CNAME records):
- Enable DKIM in Instantly account settings
- Add the provided CNAME records to your domain DNS
- Wait 24-48 hours for propagation, then verify

**DMARC record** (DNS TXT `_dmarc.yourdomain.com`):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
```

### Domain Rotation Strategy

- Use 2-3 domains per brand (e.g. `getbrand.com`, `trybrand.io`, `usebrand.com`)
- Never use your primary brand domain for cold outreach
- Rotate which domain sends which campaign — if one domain gets blacklisted, others continue
- Keep domain age ≥30 days before adding to any campaign

### Warmup Schedule

| Day | Emails/Day | Notes |
|-----|------------|-------|
| 1-3 | 5 | Let Instantly handle warmup automatically |
| 4-7 | 8 | Check warmup score — should be climbing |
| 8-14 | 15 | Score should reach 70+ by day 14 |
| 14+ | Up to 30 | Only start real campaigns at day 14 with score ≥80 |

Add 3 emails/day per account per week until you reach your target daily send rate. Never jump from warmup to full volume in one step.

### Content Deliverability Rules

Plain text only in cold outreach sequences. No exceptions at scale.

| Rule | Why |
|------|-----|
| No HTML or rich text | HTML triggers spam filters at volume |
| No images or tracking pixels in first email | Spam signal + blocks open tracking accuracy |
| No links in email 1 | Single biggest spam trigger at scale |
| Calendar link only after positive reply | Never in the sequence itself |
| No attachments in any sequence step | Immediate spam folder |
| Keep email under 150 words | Longer emails get lower open rates at volume |

### Spam Trigger Words to Avoid

Never use these in subject lines or email body:

```
free, guarantee, limited time, act now, urgent, don't miss out, 
click here, earn money, risk-free, no obligation, winner, 
100%, amazing, incredible, unsubscribe (in body — put in sig only)
```

---

## Metrics

Track these weekly. Fix copy and targeting before adding volume.

| Metric | Target | Critical Threshold | Action |
|--------|--------|--------------------|--------|
| Open rate | 50%+ | <35% | Fix subject lines |
| Reply rate (any) | 3-7% | <2% | Fix first email body or ICP targeting |
| Positive reply rate | 1-3% | <0.5% | Fix ICP targeting or personalization |
| Bounce rate | <3% | >5% = STOP | Verify emails, clean list |
| Spam complaint rate | <0.1% | >0.1% = pause | Review content + targeting |
| Unsubscribe rate | <1% | >2% | Review targeting or messaging |
| Hunter email found rate | 60-70% | <40% | Expand domain search, use patterns |
| Warmup score (all accounts) | ≥80 | <70 = pause account | Reduce volume, let warmup recover |

### Weekly Review Questions

1. Which subject line variant got the highest open rate?
2. Which touch in the sequence got the most replies?
3. Which ICP segment is converting best? Which is dragging metrics down?
4. Which objection keeps coming up? (Adjust messaging to pre-empt it.)
5. What's the bounce rate trend — improving or degrading?
6. Are any sending accounts showing warmup score drops?
7. What's the average days-to-meeting from first touch?

---

## Guidelines

### CAN-SPAM / GDPR Compliance

- Always include your full name, company name, and physical address in your signature
- Include opt-out language in every email: "Reply 'unsubscribe' to be removed from future emails"
- For EU prospects: only contact people where you have legitimate business interest (B2B outreach to relevant roles is generally permitted under GDPR's legitimate interest basis — document your basis)
- Remove anyone who unsubscribes immediately and permanently — same day, no exceptions
- Never purchase email lists — only contact people you've researched and verified
- At high volume, unsubscribe processing must be systematic — check daily and process same day

### Personalization Rules (at Scale)

- Segment-level personalization is acceptable at volume. Individual personalization is reserved for Tier 1 accounts.
- "I love what {{company_name}} is doing" is not personalization — it is a mail merge that reads like one
- `{{custom_field_trigger}}` and `{{custom_field_pain}}` must be populated with real, specific data — not generic placeholders
- If a custom field is empty, Instantly will send the fallback or the raw field name. Audit your data before importing.
- Use `{{first_name}}` once in the opener. Do not pepper it throughout.

### Timing

- Send Monday-Thursday only — Friday sends underperform by 20%+
- 7am-11am in prospect's local timezone — Instantly handles timezone-aware scheduling per lead
- Avoid US holidays, major industry events (your ICP's inbox is chaotic those days)

### Connector Error Handling

- If `INSTANTLY_CREATE_LEAD` returns an auth error: check `INTERNAL_API_KEY` and `EMPLOYEE_ID` in the connector config
- If `INSTANTLY_VERIFY_EMAIL` returns `unknown`: wait 24 hours and retry — some corporate mail servers throttle verification
- If `HUNTER_EMAIL_FINDER` returns no result: try `HUNTER_DOMAIN_SEARCH` to get the domain pattern, construct manually, then verify with Instantly before importing
- If campaign activation fails: confirm all sequence steps are attached and at least one sending account has warmup score ≥80
- If bounce rate spikes unexpectedly mid-campaign: pause immediately, pull `INSTANTLY_GET_DAILY_CAMPAIGN_ANALYTICS` to isolate the day, check which sending account and list segment drove the spike
- Log all connector errors with timestamp, campaign ID, and lead email for debugging

### Emergency Stops

- **Bounce rate >5%**: STOP all campaigns immediately. Do not resume until you have identified and removed the bad leads, and all sending accounts have been checked for warmup score impact.
- **Any spam complaint from a major provider (Google, Microsoft)**: Pause all campaigns on that sending domain. Investigate immediately. One spam complaint per 1,000 sends is the threshold — above that, you risk domain blacklist.
- **Warmup score drops >20 points in 7 days**: Pause the account. Do not reassign it to campaigns until score recovers. Investigate whether a paused account's previous sends drove complaints.
