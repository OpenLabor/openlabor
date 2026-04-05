---
name: Conversion Audit
description: "Score landing pages across 8 CRO dimensions from a URL — plus survey-to-lead-magnet pipeline from CSV data"
category: Marketing
roles:
  - cmo
  - sdr
  - lead-finder
triggers:
  - "audit this page"
  - "CRO score"
  - "landing page review"
  - "conversion audit"
  - "score this landing page"
  - "lead magnet from survey"
---

<!-- openlabor-connector: research, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

## Overview

Two tools in one skill. Tool 1: give it a URL, get an 8-dimension CRO score. Tool 2: give it survey CSV data, get lead magnet strategies per segment. Zero external API cost — uses JINA_READ to fetch pages.

---

## Tool 1: CRO Page Audit

### Step 1: Fetch the Page

```
use research JINA_READ '{"url":"TARGET_URL"}'
```

This returns the page content as clean markdown. Parse it for: headlines, CTAs, form fields, testimonials, trust signals, images, meta tags.

### Step 2: Score 8 Dimensions (each 0-100)

**1. Headline Clarity (0-100)**
- 90-100: Value prop obvious in <5 seconds, specific benefit, customer language
- 70-89: Clear but generic, could be any company
- 50-69: Vague or feature-focused instead of benefit-focused
- 0-49: Missing, confusing, or purely clever (no meaning)

**2. CTA Visibility (0-100)**
- 90-100: Above fold, contrasting color, specific text ("Start Free Trial"), low-commitment
- 70-89: Present but generic ("Sign Up", "Learn More")
- 50-69: Below fold only, or blends with design
- 0-49: Missing or buried

**3. Social Proof (0-100)**
- 90-100: Named testimonials with photos + results, recognizable logos, specific numbers ("14,000 teams")
- 70-89: Testimonials present but generic ("Great product!")
- 50-69: Logos only, or vague claims ("Trusted by thousands")
- 0-49: No social proof at all

**4. Urgency/Scarcity (0-100)**
- 90-100: Genuine scarcity with deadline or limited availability
- 70-89: Soft urgency ("Start today", "Don't miss out")
- 50-69: No urgency but has clear next step
- 0-49: No reason to act now

**5. Trust Signals (0-100)**
- 90-100: Money-back guarantee + security badges + privacy policy + recognizable certifications
- 70-89: Some trust elements present
- 50-69: Only basic footer links
- 0-49: No trust indicators

**6. Form Friction (0-100)**
- 90-100: 1-3 fields, no credit card, instant value
- 70-89: 4-5 fields, reasonable
- 50-69: 6+ fields or requires credit card upfront
- 0-49: Long forms, mandatory phone, complex multi-step

**7. Mobile Responsiveness (0-100)**
- Check viewport meta tag, responsive patterns in the HTML
- Score based on: readable font sizes, tap targets, no horizontal scroll indicators

**8. Page Speed Indicators (0-100)**
- Check: image count/sizes, script count, inline CSS vs external, lazy loading
- Score based on resource weight signals in the HTML

**Overall CRO Score** = weighted average:
- Headline Clarity: 20%
- CTA Visibility: 20%
- Social Proof: 15%
- Trust Signals: 15%
- Form Friction: 10%
- Urgency: 10%
- Mobile: 5%
- Speed: 5%

**Letter grades:** A+ (95-100), A (90-94), B+ (85-89), B (80-84), C+ (75-79), C (70-74), D (60-69), F (<60)

### Step 3: Priority Fixes

For each dimension scoring below 70, generate:
- **Issue**: what's wrong specifically
- **Fix**: concrete copy/design change
- **Impact**: estimated lift (Low/Medium/High)
- **Effort**: implementation difficulty (Low/Medium/High)

Rank fixes by Impact/Effort ratio — highest impact, lowest effort first.

### Step 4: Industry Benchmarks

Compare scores against industry averages:

| Industry   | Avg CRO Score | Top Quartile |
|------------|---------------|--------------|
| SaaS       | 62            | 78+          |
| Ecommerce  | 58            | 74+          |
| Agency     | 55            | 72+          |
| B2B        | 52            | 68+          |
| Finance    | 60            | 76+          |
| Healthcare | 48            | 64+          |

### Step 5: Output Format

```
## CRO Audit: [URL]
**Overall Score: [XX]/100 — Grade: [Letter]**
**Industry: [detected or specified] — Benchmark: [avg] — Your position: [above/below/at]**

### Dimension Scores
| Dimension | Score | Status | Key Finding |
(table with all 8 dimensions, green/yellow/red status)

### Priority Fixes (ranked by impact/effort)
1. [Highest priority fix with specific copy suggestion]
2. ...
3. ...

### What's Working Well
- [Positive findings]

### Competitor Comparison (if URLs provided)
(side-by-side scores)
```

---

## Tool 2: Survey-to-Lead-Magnet

### Step 1: Ingest CSV

User provides survey CSV (from Typeform, Google Forms, SurveyMonkey, etc.)
Parse: identify pain point columns, demographic columns, response counts.

### Step 2: Cluster Pain Points

Group responses by similar themes. For each cluster:
- Cluster name
- Response count (% of total)
- Representative quotes
- Commercial potential (High/Medium/Low based on buying intent signals)

### Step 3: Generate Lead Magnets

For each top cluster (max 5), generate:
- **Title**: specific, benefit-driven
- **Format**: guide / checklist / template / calculator / quiz (pick best for the pain point)
- **Hook**: one sentence that would make this segment click
- **Outline**: 5-7 sections
- **CTA**: what happens after they download
- **Distribution**: best channel to reach this segment
- **Viral score**: 1-10 likelihood of sharing
- **Conversion score**: 1-10 likelihood of converting to customer

### Step 4: Implementation Roadmap

Prioritize lead magnets by: segment size × commercial potential × ease of creation

---

## Guidelines

- Always fetch the actual page — don't score from description alone
- Be brutally honest in scoring — inflated scores help nobody
- Provide SPECIFIC copy suggestions, not generic advice
- Compare to competitors when URLs are provided
- Survey clustering should use actual response text, not just column headers
