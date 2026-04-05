---
name: Instantly Outbound
description: "Manage cold email campaigns at scale — create campaigns, import leads, track warmup, monitor deliverability, and analyze performance via Composio"
category: Sales
roles:
  - sdr
  - lead-finder
  - cmo
platforms:
  - instantly
---

<!-- openlabor-connector: instantly, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# Instantly Outbound

Manage cold email campaigns at scale — create campaigns, import leads, track warmup, monitor deliverability, and analyze performance.

You have access to Instantly through the OpenLabor connector API.

## How to Execute Instantly Actions

Use the exec tool to run `use`. Credentials are loaded automatically from the workspace.

```
use instantly <TOOL_NAME> '<json_args>'
```

---

## Campaign Management

- `INSTANTLY_CREATE_CAMPAIGN` — Create a new email campaign
  Args: `{ "name": "Campaign Name", "schedule": {...} }`

- `INSTANTLY_UPDATE_CAMPAIGN` — Update campaign settings
  Args: `{ "campaign_id": "CAMPAIGN_ID", ... }`

- `INSTANTLY_DELETE_CAMPAIGN` — Delete a campaign
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_GET_CAMPAIGN` — Get campaign details
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_GET_CAMPAIGN_ANALYTICS` — Campaign performance metrics (opens, replies, bounces)
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_GET_DAILY_CAMPAIGN_ANALYTICS` — Day-by-day breakdown
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_SEARCH_CAMPAIGNS_BY_LEAD_EMAIL` — Find which campaigns a lead is in
  Args: `{ "email": "lead@example.com" }`

- `INSTANTLY_ACTIVATE_SUBSEQUENCE` — Start/resume campaign sending
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_STOP_SUBSEQUENCE` — Pause campaign sending
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

---

## Lead Management

- `INSTANTLY_CREATE_LEAD` — Add a single lead
  Args: `{ "email": "lead@example.com", "first_name": "John", "last_name": "Smith", "company_name": "Acme", "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_UPDATE_LEAD` — Update lead info
  Args: `{ "email": "lead@example.com", ... }`

- `INSTANTLY_DELETE_LEAD` — Remove a lead
  Args: `{ "email": "lead@example.com" }`

- `INSTANTLY_GET_LEAD` — Get lead details
  Args: `{ "email": "lead@example.com" }`

- `INSTANTLY_MERGE_LEADS` — Merge duplicate leads
  Args: `{ "source_email": "...", "target_email": "..." }`

- `INSTANTLY_UPDATE_LEAD_INTEREST_STATUS` — Mark lead as interested/not interested/wrong person
  Args: `{ "email": "lead@example.com", "interest_status": "interested" }`

- `INSTANTLY_LIST_LEADS` — List leads with filters
  Args: `{ "campaign_id": "CAMPAIGN_ID", "limit": "100" }`

---

## Lead Lists

- `INSTANTLY_CREATE_LEAD_LIST` — Create a list for segmentation
  Args: `{ "name": "Q2 SaaS Founders" }`

- `INSTANTLY_UPDATE_LEAD_LIST` — Update list
  Args: `{ "list_id": "LIST_ID", ... }`

- `INSTANTLY_DELETE_LEAD_LIST` — Delete list
  Args: `{ "list_id": "LIST_ID" }`

- `INSTANTLY_GET_LEAD_LIST` — Get list details
  Args: `{ "list_id": "LIST_ID" }`

- `INSTANTLY_GET_LEAD_LIST_VERIFICATION_STATS` — Email verification results for a list
  Args: `{ "list_id": "LIST_ID" }`

---

## Email Operations

- `INSTANTLY_VERIFY_EMAIL` — Verify a single email address
  Args: `{ "email": "lead@example.com" }`

- `INSTANTLY_CHECK_EMAIL_VERIFICATION_STATUS` — Check verification result
  Args: `{ "email": "lead@example.com" }`

- `INSTANTLY_COUNT_UNREAD_EMAILS` — Unread email count across accounts
  Args: `{}`

- `INSTANTLY_LIST_EMAILS` — List emails (sent, received, replied)
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_LIST_EMAIL_THREADS` — List email conversation threads
  Args: `{ "campaign_id": "CAMPAIGN_ID" }`

- `INSTANTLY_MARK_THREAD_AS_READ` — Mark thread read
  Args: `{ "thread_id": "THREAD_ID" }`

- `INSTANTLY_LIST_EMAIL_ACCOUNTS` — List connected sending accounts
  Args: `{}`

---

## Warmup & Deliverability

- `INSTANTLY_ENABLE_ACCOUNT_WARMUP` — Start warming up a sending account
  Args: `{ "account_id": "ACCOUNT_ID" }`

- `INSTANTLY_DISABLE_ACCOUNT_WARMUP` — Stop warmup
  Args: `{ "account_id": "ACCOUNT_ID" }`

- `INSTANTLY_CREATE_INBOX_PLACEMENT_TEST` — Test if emails land in inbox vs spam
  Args: `{ "account_id": "ACCOUNT_ID" }`

- `INSTANTLY_GET_INBOX_PLACEMENT_TEST` — Get placement test results
  Args: `{ "test_id": "TEST_ID" }`

- `INSTANTLY_LIST_INBOX_PLACEMENT_TESTS` — List all placement tests
  Args: `{}`

- `INSTANTLY_LIST_INBOX_PLACEMENT_BLACKLIST_REPORTS` — Check blacklist status
  Args: `{}`

- `INSTANTLY_GET_EMAIL_SERVICE_PROVIDER_OPTIONS` — ESP configuration options
  Args: `{}`

---

## Webhooks

- `INSTANTLY_CREATE_WEBHOOK` — Set up reply/open/bounce notifications
  Args: `{ "url": "https://...", "event_type": "reply" }`

- `INSTANTLY_DELETE_WEBHOOK` — Remove webhook
  Args: `{ "webhook_id": "WEBHOOK_ID" }`

- `INSTANTLY_GET_WEBHOOK` — Get webhook details
  Args: `{ "webhook_id": "WEBHOOK_ID" }`

- `INSTANTLY_LIST_WEBHOOKS` — List all webhooks
  Args: `{}`

- `INSTANTLY_GET_WEBHOOK_EVENT` — Get specific event data
  Args: `{ "event_id": "EVENT_ID" }`

- `INSTANTLY_LIST_WEBHOOK_EVENTS` — List webhook events
  Args: `{}`

---

## API & Configuration

- `INSTANTLY_CREATE_API_KEY` — Create new API key with scopes
  Args: `{ "name": "Key Name", "scopes": ["campaign:read", "lead:create"] }`

- `INSTANTLY_LIST_API_KEYS` — List existing keys
  Args: `{}`

- `INSTANTLY_DELETE_API_KEY` — Revoke a key
  Args: `{ "key_id": "KEY_ID" }`

- `INSTANTLY_CREATE_AI_ENRICHMENT` — AI-powered lead enrichment
  Args: `{ "lead_email": "lead@example.com" }`

- `INSTANTLY_LIST_CUSTOM_TAGS` — List campaign/lead tags
  Args: `{}`

- `INSTANTLY_LIST_DFY_EMAIL_ACCOUNT_ORDERS` — List managed email account orders
  Args: `{}`

---

## Common Workflows

### Check Account Health
1. List accounts: `INSTANTLY_LIST_EMAIL_ACCOUNTS`
2. Check warmup status for each
3. Run inbox placement test: `INSTANTLY_CREATE_INBOX_PLACEMENT_TEST`
4. Check results: `INSTANTLY_GET_INBOX_PLACEMENT_TEST`
5. Check blacklist: `INSTANTLY_LIST_INBOX_PLACEMENT_BLACKLIST_REPORTS`

### Launch a Campaign
1. Create lead list: `INSTANTLY_CREATE_LEAD_LIST`
2. Add leads: `INSTANTLY_CREATE_LEAD` (for each)
3. Verify emails: `INSTANTLY_VERIFY_EMAIL` (for each)
4. Create campaign: `INSTANTLY_CREATE_CAMPAIGN`
5. Activate: `INSTANTLY_ACTIVATE_SUBSEQUENCE`
6. Monitor: `INSTANTLY_GET_CAMPAIGN_ANALYTICS`

### Monitor Replies
1. Count unread: `INSTANTLY_COUNT_UNREAD_EMAILS`
2. List threads: `INSTANTLY_LIST_EMAIL_THREADS`
3. Mark interested leads: `INSTANTLY_UPDATE_LEAD_INTEREST_STATUS`

---

## Instantly Concepts

- **Warmup**: New email accounts need 2-4 weeks of gradual sending to build reputation. Always warmup before launching campaigns.
- **Sending accounts**: Multiple email accounts rotate to spread volume. Rule: max 30-50 emails/day per account.
- **Subsequences**: Campaign steps (email 1, follow-up 1, follow-up 2). Each step has a delay.
- **Lead status**: new → contacted → replied → interested → not_interested → wrong_person
- **Inbox placement**: Tests whether emails land in inbox, spam, or promotions tab.

---

## Guidelines
1. Always verify emails before adding to campaigns
2. Never send from accounts with <14 days warmup or <80 warmup score
3. Max 30-50 emails/day per sending account (conservative)
4. Always check campaign analytics before scaling volume
5. Run inbox placement tests weekly
6. If you get a 400 "not connected" error, tell the user to connect Instantly in the Apps tab
7. Never expose API keys or lead data to the user
8. Human approval required before activating any campaign
