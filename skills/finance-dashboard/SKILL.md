---
name: Finance Dashboard
description: "Revenue reports, MRR/ARR tracking, churn analysis, invoice aging, and financial health metrics — powered by Stripe data"
category: Finance
roles:
  - accountant
  - ceo
  - cmo
platforms:
  - stripe
---

<!-- openlabor-connector: stripe, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# Finance Dashboard

Penny (accountant) can pull Stripe data and generate executive-ready financial reports. All data comes from the Stripe connector — no new integrations needed.

## How to Execute Stripe Actions

```
use stripe <TOOL_NAME> '<json_args>'
```

## Data Sources

| Data | Tool | Args |
|------|------|------|
| All active subscriptions | `STRIPE_LIST_SUBSCRIPTIONS` | `{}` |
| Customer list | `STRIPE_LIST_CUSTOMERS` | `{}` |
| Invoice history | `STRIPE_LIST_INVOICES` | `{}` |
| Payment history | `STRIPE_LIST_PAYMENT_INTENTS` | `{}` |
| Current balance | `STRIPE_RETRIEVE_BALANCE` | `{}` |
| Customer detail | `STRIPE_RETRIEVE_CUSTOMER` | `{"customer_id":"cus_XXX"}` |
| Subscription detail | `STRIPE_RETRIEVE_SUBSCRIPTION` | `{"subscription_id":"sub_XXX"}` |
| Refund data | `STRIPE_LIST_REFUNDS` | `{}` |

---

## Report Types

### 1. Monthly Revenue Summary

Pull all payments for the period using `STRIPE_LIST_PAYMENT_INTENTS`. Calculate:

- **Total Revenue** — sum of all successful payments (status: `succeeded`)
- **MRR** (Monthly Recurring Revenue) — sum of active subscription amounts ÷ billing interval in months
- **ARR** — MRR × 12
- **New MRR** — from subscriptions created this month (`created` timestamp in current month)
- **Churned MRR** — from subscriptions cancelled this month (`canceled_at` in current month)
- **Net MRR Growth** — New MRR − Churned MRR
- **Revenue by Plan** — breakdown grouped by `plan.nickname` or `price.id`

Present with month-over-month comparison and % change for each metric.

**Output table:**

| Metric | Current Month | Previous Month | Change (%) | Status |
|--------|--------------|----------------|------------|--------|
| Total Revenue | $X,XXX | $X,XXX | +X% | 🟢/🟡/🔴 |
| MRR | $X,XXX | $X,XXX | +X% | 🟢/🟡/🔴 |
| ARR | $XX,XXX | $XX,XXX | +X% | 🟢/🟡/🔴 |
| New MRR | $XXX | $XXX | — | — |
| Churned MRR | $XXX | $XXX | — | — |
| Net MRR Growth | $XXX | $XXX | — | 🟢/🟡/🔴 |

---

### 2. Customer Health Report

Pull customers via `STRIPE_LIST_CUSTOMERS` and subscriptions via `STRIPE_LIST_SUBSCRIPTIONS`. Calculate:

- **Total Customers** — count of active customers with at least one active subscription
- **New Customers** — customers with `created` in current month
- **Churned Customers** — subscriptions with `canceled_at` in current month, deduplicated by customer
- **Churn Rate** — churned customers ÷ total customers at start of month × 100
- **Customer Lifetime Value (LTV)** — average monthly revenue per customer ÷ monthly churn rate
- **LTV:CAC Ratio** — LTV ÷ CAC (ask user for CAC if not provided)
- **Top 10 Customers by Revenue** — list with name, plan, MRR contribution, and subscription start date

**Output table:**

| Metric | Value | Previous Period | Change | Status |
|--------|-------|----------------|--------|--------|
| Total Customers | X | X | +X | 🟢/🟡/🔴 |
| New Customers | X | X | +X | — |
| Churned Customers | X | X | +X | 🟢/🟡/🔴 |
| Churn Rate | X% | X% | +X% | 🟢/🟡/🔴 |
| LTV | $X,XXX | $X,XXX | — | — |

**Top 10 Customers:**

| Customer Name | Plan | Monthly Value | Since |
|--------------|------|--------------|-------|
| Acme Corp | Pro | $X,XXX | Jan 2025 |
| ... | ... | ... | ... |

---

### 3. Invoice Aging Report

Pull all open invoices via `STRIPE_LIST_INVOICES` (filter `status: open`). Categorize by days since `due_date`:

- **Current** — not yet past due date
- **1–30 days overdue** — due date 1–30 days ago
- **31–60 days overdue** — due date 31–60 days ago
- **60+ days overdue** — due date over 60 days ago
- **Total Outstanding** — sum of all unpaid invoice amounts

Flag all invoices over 30 days for immediate follow-up. List specific customer names and amounts (never raw IDs).

**Output table:**

| Aging Bucket | Count | Total Amount | Status |
|-------------|-------|-------------|--------|
| Current | X | $X,XXX | 🟢 |
| 1–30 days | X | $X,XXX | 🟡 |
| 31–60 days | X | $X,XXX | 🔴 |
| 60+ days | X | $X,XXX | 🔴 |
| **Total Outstanding** | **X** | **$X,XXX** | — |

**Overdue Invoices (30+ days):**

| Customer Name | Invoice Amount | Days Overdue | Action |
|--------------|---------------|-------------|--------|
| Acme Corp | $X,XXX | 45 days | Send follow-up |
| ... | ... | ... | ... |

---

### 4. Cash Flow Snapshot

Pull balance via `STRIPE_RETRIEVE_BALANCE`, payments via `STRIPE_LIST_PAYMENT_INTENTS`, and refunds via `STRIPE_LIST_REFUNDS`.

- **Available Balance** — `available[0].amount` from balance response (convert from cents)
- **Pending Balance** — `pending[0].amount` — funds in transit, not yet settled
- **Recent Refunds** — sum of all refunds with `created` in current month
- **Net Revenue** — total successful payments minus total refunds for the month
- **Projected Next Month** — sum of all active subscription amounts due next billing cycle

**Output table:**

| Metric | Amount | Notes |
|--------|--------|-------|
| Available Balance | $X,XXX | Ready to pay out |
| Pending Balance | $X,XXX | In transit |
| Gross Revenue (MTD) | $X,XXX | Successful payments |
| Refunds (MTD) | $X,XXX | Total refunded |
| Net Revenue (MTD) | $X,XXX | Gross minus refunds |
| Projected Next Month | $X,XXX | Based on active subs |

---

### 5. Plan & Pricing Analysis

Pull subscriptions and group by plan/price. Calculate per tier:

- **Revenue per tier** — sum of subscription amounts per `plan.nickname` or `price.id`
- **Customer count per tier** — subscriptions grouped by plan
- **ARPU** (Average Revenue Per User) — tier revenue ÷ tier customer count
- **Churn by tier** — cancellations per tier as % of that tier's total
- **Upgrade vs. downgrade trends** — subscriptions where `plan` changed (use metadata or subscription item changes)

**Output table:**

| Plan | Customers | MRR | ARPU | Churn Rate | Status |
|------|-----------|-----|------|-----------|--------|
| Starter | X | $X,XXX | $XX | X% | 🟢/🟡/🔴 |
| Pro | X | $X,XXX | $XX | X% | 🟢/🟡/🔴 |
| Enterprise | X | $X,XXX | $XXX | X% | 🟢/🟡/🔴 |
| **Total** | **X** | **$X,XXX** | **$XX** | **X%** | — |

---

## Status Thresholds

| Metric | 🟢 On Track | 🟡 Watch | 🔴 Action Needed |
|--------|------------|---------|-----------------|
| Revenue growth | > 0% | 0% | < 0% |
| Monthly churn rate | < 3% | 3–5% | > 5% |
| Invoice aging | All current | 1–30 days overdue | 31+ days overdue |
| LTV:CAC ratio | > 5 | 3–5 | < 3 |
| Net MRR growth | Positive | Flat | Negative |

For every 🔴 metric, provide a specific recommended action (e.g., "Send payment reminder to Acme Corp — $2,400 overdue 45 days").

---

## When to Activate

Triggers: "revenue report", "MRR", "ARR", "churn report", "invoice aging", "financial health", "cash flow", "how much did we make", "revenue breakdown", "customer health", "plan analysis", "financial summary", "billing report"

---

## Guidelines

1. All Stripe amounts are in **cents** — always divide by 100 before displaying (e.g., 12400 → $124.00)
2. Always state the time period covered at the top of every report (e.g., "March 2026 | Data as of April 2, 2026")
3. Never expose raw Stripe IDs (cus_XXX, sub_XXX, in_XXX) — use customer names or plan names
4. Flag anomalies explicitly: sudden churn spike, large single refund, payment failure cluster
5. Present numbers with context: "MRR is $12,400 — up 8% from last month" not just "$12,400"
6. For 🔴 metrics, always include a concrete recommended next action
7. If CAC is not available, skip LTV:CAC and note: "Provide CAC to calculate LTV:CAC ratio"
8. When comparing periods, use calendar months unless the user specifies otherwise
9. Confirm with user before taking any write actions (creating invoices, issuing refunds)
10. If Stripe is not connected, prompt: "Connect Stripe in the Apps tab to generate financial reports"
