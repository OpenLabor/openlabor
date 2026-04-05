---
name: Growth Experiment Engine
description: "A/B test tracking with statistical significance — create experiments, log data, score winners with bootstrap CI + Mann-Whitney U, auto-promote to a living playbook"
category: Marketing
roles:
  - cmo
  - analyst
platforms:
  - airtable
---

<!-- openlabor-connector: airtable, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# Growth Experiment Engine

The only skill in the system that does real statistical math. Create A/B experiments, log results, compute bootstrap confidence intervals and Mann-Whitney U significance tests, and auto-promote winners to a living playbook.

---

## Step 1: Create Experiment

Define the experiment before any data is collected.

**Required fields:**

| Field | Description | Example |
|-------|-------------|---------|
| Hypothesis | "Changing X will improve Y by Z%" | "Shorter subject lines will improve open rate by 15%" |
| Variable | What you're testing | Subject line length |
| Variants | 2–10 variants labeled A, B, C… | A (control, 8+ words), B (4 words or fewer) |
| Primary Metric | What you're measuring | open_rate |
| Cycle | How often to check | 24h / 48h / 7d |
| Minimum Sample | Per variant before scoring | 30 (low-volume) or 100 (high-volume) |

**Create the experiment record:**

```
use airtable AIRTABLE_CREATE_RECORDS '{
  "table": "experiments",
  "fields": {
    "experiment_id": "EXP-001",
    "hypothesis": "Shorter subject lines will improve open rate by 15%",
    "variable": "Subject line length",
    "variants": "A,B",
    "metric": "open_rate",
    "cycle": "48h",
    "min_sample": 100,
    "status": "running",
    "created_date": "2026-04-02"
  }
}'
```

**Channel categories:**

- Email: subject lines, send times, CTAs, body length
- Social: posting times, formats, hashtags, hooks
- Ads: headlines, creatives, audiences, bidding
- Landing pages: headlines, CTAs, layouts, social proof
- Content: titles, formats, topics, lengths

---

## Step 2: Log Data Points

Log results for each variant as they come in. One record per measurement cycle.

```
use airtable AIRTABLE_CREATE_RECORDS '{
  "table": "experiment_results",
  "fields": {
    "experiment_id": "EXP-001",
    "variant": "A",
    "metric_value": 0.21,
    "sample_size": 120,
    "date": "2026-04-03"
  }
}'
```

**Example data log table:**

| Experiment ID | Variant | Metric Value | Sample Size | Date |
|---------------|---------|--------------|-------------|------|
| EXP-001 | A | 0.21 | 120 | 2026-04-03 |
| EXP-001 | B | 0.26 | 118 | 2026-04-03 |
| EXP-001 | A | 0.19 | 135 | 2026-04-05 |
| EXP-001 | B | 0.28 | 131 | 2026-04-05 |

**Rules:**
- Log consistently — missing data points invalidate results
- One variable per experiment, never test multiple things at once
- Variant A is always the control group

---

## Step 3: Score Experiment

This is the core value. When each variant has reached minimum sample size, run statistical analysis.

### Bootstrap Confidence Interval (95%)

For each variant, compute a non-parametric confidence interval by resampling.

**Algorithm (N = 1000 bootstrap iterations):**

```
Given: observations = [x1, x2, ..., xn] for one variant

bootstrap_means = []
for i in 1..1000:
    sample = draw n values from observations with replacement
    bootstrap_means.append(mean(sample))

sort(bootstrap_means)
CI_lower = bootstrap_means[25]     # 2.5th percentile  (index 25 of 1000)
CI_upper = bootstrap_means[975]    # 97.5th percentile (index 975 of 1000)
```

**Example calculation:**

Variant A observations (open rates): [0.18, 0.21, 0.23, 0.19, 0.22, ...]

1. Draw 100 values with replacement → compute mean → repeat 1000 times
2. Sort 1000 means → [0.17, 0.18, 0.18, ..., 0.24, 0.25]
3. 95% CI = [mean at index 25, mean at index 975]

Report as: **A: mean=0.205, 95% CI [0.19, 0.22]**

---

### Mann-Whitney U Test (non-parametric significance)

Tests whether variant B is drawn from a different distribution than variant A, without assuming normality.

**Formula — step by step:**

```
Given: group_A = [a1, a2, ..., a_nA]  (control)
       group_B = [b1, b2, ..., b_nB]  (challenger)

Step 1 — Combine and rank all observations:
  combined = group_A + group_B  (length = nA + nB)
  Assign ranks 1 to (nA + nB), lowest value = rank 1
  For ties: assign the average of the tied ranks

Step 2 — Sum ranks per group:
  R_A = sum of ranks for all observations in group_A
  R_B = sum of ranks for all observations in group_B

Step 3 — Compute U statistics:
  U_A = R_A - nA*(nA + 1)/2
  U_B = R_B - nB*(nB + 1)/2
  U   = min(U_A, U_B)

Step 4 — Z-score (valid when nA > 20 and nB > 20):
  mean_U  = nA * nB / 2
  sigma_U = sqrt( nA * nB * (nA + nB + 1) / 12 )
  z       = (U - mean_U) / sigma_U

Step 5 — Two-tailed p-value from z:
  p = 2 * (1 - Phi(|z|))
  where Phi is the standard normal CDF

  Approximation table for |z|:
    |z| = 1.65 → p ≈ 0.10
    |z| = 1.96 → p ≈ 0.05
    |z| = 2.58 → p ≈ 0.01
    |z| = 3.29 → p ≈ 0.001
```

**Example calculation:**

- Group A (n=5): [0.18, 0.19, 0.21, 0.22, 0.23]
- Group B (n=5): [0.24, 0.26, 0.27, 0.28, 0.30]

Combined ranked: A values get ranks 1–5, B values get ranks 6–10

R_A = 1+2+3+4+5 = 15, R_B = 6+7+8+9+10 = 40

U_A = 15 - 5*6/2 = 15 - 15 = 0

U_B = 40 - 5*6/2 = 40 - 15 = 25

U = min(0, 25) = 0

mean_U = 5*5/2 = 12.5, sigma_U = sqrt(5*5*11/12) = sqrt(22.9) = 4.79

z = (0 - 12.5) / 4.79 = -2.61 → |z| = 2.61 → p ≈ 0.009

---

### Lift Calculation

```
lift = (mean_B - mean_A) / mean_A * 100    (expressed as %)
```

---

### Winner Decision Rules

| Condition | Decision |
|-----------|----------|
| p < 0.05 AND lift ≥ 15% | **KEEP** — winner found, promote to playbook |
| p < 0.10 AND lift ≥ 10% | **TRENDING** — promising, collect more data |
| p ≥ 0.10 OR lift < 10% | **INCONCLUSIVE** — no winner yet |
| 3+ cycles with no winner | **DISCARD** — no meaningful difference exists |

---

### Score Results Table

Present all results in this format:

| Variant | Mean | 95% CI | vs Control | Lift | p-value | Decision |
|---------|------|--------|------------|------|---------|----------|
| A (control) | 0.205 | [0.19, 0.22] | — | — | — | baseline |
| B | 0.268 | [0.25, 0.29] | +0.063 | +30.7% | 0.009 | **KEEP** |

**Update experiment status in Airtable after scoring:**

```
use airtable AIRTABLE_UPDATE_RECORDS '{
  "table": "experiments",
  "record_id": "<record_id>",
  "fields": {
    "status": "complete",
    "winner": "B",
    "lift": 30.7,
    "p_value": 0.009,
    "decision": "KEEP",
    "scored_date": "2026-04-05"
  }
}'
```

---

## Step 4: Living Playbook

When an experiment is marked KEEP, add the winning insight to the playbook. This is the compounding return on all experiments run.

**Playbook entry format:**

```markdown
## [Date] — [Variable Tested]
- Winner: [Variant description] beat [Control description] by [Lift]% (p=[value])
- Insight: [What we learned in plain language]
- Apply to: [Where this insight should be used going forward]
```

**Example entry:**

```markdown
## 2026-04-05 — Email Subject Line Length
- Winner: 4-word subject lines beat 8+ word subject lines by 30.7% (p=0.009)
- Insight: Brevity wins in crowded inboxes. Short subject lines increase curiosity without over-explaining.
- Apply to: All future campaign emails, automated sequences, cold outreach
```

**Store playbook entry in Airtable:**

```
use airtable AIRTABLE_CREATE_RECORDS '{
  "table": "playbook",
  "fields": {
    "date": "2026-04-05",
    "variable": "Email subject line length",
    "winner_description": "4-word subject lines",
    "control_description": "8+ word subject lines",
    "lift_pct": 30.7,
    "p_value": 0.009,
    "insight": "Brevity wins in crowded inboxes.",
    "apply_to": "All future campaign emails, automated sequences, cold outreach",
    "experiment_id": "EXP-001"
  }
}'
```

---

## Step 5: Suggest Next Experiments

After each completed experiment, generate the next test to run based on results.

**Decision logic:**

| Previous Result | Next Experiment |
|-----------------|-----------------|
| KEEP (strong winner) | Test variations of the winner — push further in the same direction |
| TRENDING (needs more data) | Continue current experiment or test a more extreme version |
| INCONCLUSIVE | Test a more extreme variation of the same variable |
| DISCARD | Move to a different variable in the same channel |
| No experiments in a category | Suggest the highest-leverage first experiment for that channel |

**Suggested first experiments by channel:**

- Email: subject line length (highest open-rate impact)
- Social: posting time (AM vs PM vs evening)
- Ads: headline (value prop vs pain point vs curiosity)
- Landing page: headline (feature vs outcome vs social proof)
- Content: title format (how-to vs list vs question)

---

## Step 6: Weekly Scorecard

Generate a weekly summary of all experiment activity.

**Scorecard format:**

```
## Growth Experiment Scorecard — Week of [Date]

Experiments running:         [N]
Experiments completed:       [N]
Winners found (KEEP):        [N]
Trending (need more data):   [N]
Discarded (no difference):   [N]

Total lift from winners:     [X]% (cumulative across winning metrics)

Top insight this week:
  "[Best finding from any experiment]"

Experiments to start next week:
  1. [Suggestion 1]
  2. [Suggestion 2]
  3. [Suggestion 3]
```

**Fetch data to build scorecard:**

```
use airtable AIRTABLE_LIST_RECORDS '{
  "table": "experiments",
  "filter": "status = 'complete' OR status = 'running'"
}'
```

---

## Statistical Guidelines

- **Minimum sample**: 30 per variant before scoring (100 for high-volume channels like email blasts)
- **Never declare a winner** without statistical significance (p < 0.05)
- **Always report confidence intervals**, not just p-values — a wide CI means you need more data even if p < 0.05
- **One variable per experiment** — testing multiple changes at once makes it impossible to know what caused the result
- **Variant A is always control** — the baseline you are trying to beat
- **Log data consistently** — gaps or selective logging invalidate the statistical assumptions
- **Bootstrap CI is preferred** over parametric CI (t-distribution) because conversion rates and engagement rates are not normally distributed
- **Mann-Whitney U is preferred** over t-test for the same reason — it makes no distribution assumptions
- **Lift threshold matters** — a statistically significant lift of 2% may not be worth the operational change; require ≥ 10% lift minimum
