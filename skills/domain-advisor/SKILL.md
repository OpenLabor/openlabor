---
name: domain-advisor
description: Find, check availability, analyze, and rank domain names with business-grade scoring
triggers:
  - "check domain"
  - "domain available"
  - "find domain"
  - "domain name"
  - "domain search"
  - "suggest domain"
  - "rate domain"
  - "compare domains"
argument-hint: "<domains or business description>"
---

# Domain Advisor

Your AI domain strategist. Checks availability, brainstorms names, and scores every option across 7 business dimensions — so you pick the right domain, not just an available one.

## API

**Endpoint:** `https://domain-checker.openlabor.workers.dev`

**Check availability (batch):**
```
GET /check?domains=example.com,example.ai,example.so
```

**Response:**
```json
{
  "count": 3,
  "available": 1,
  "taken": 2,
  "results": [
    { "domain": "example.com", "available": true },
    { "domain": "google.com", "available": false }
  ]
}
```

- Batch up to 20 domains per request
- Supports: .com, .ai, .io, .so, .dev, .app, .org, .net, .xyz, .co, .me, .cc, .tv and more
- Free, no API key needed — uses RDAP + DNS fallback
- Hosted on Cloudflare Workers (global, fast)

**List supported TLDs:**
```
GET /tlds
```

## When to Activate

- User asks to check if a domain is available
- User wants domain name suggestions for a project or business
- User wants to compare or rate multiple domain options
- User says "find me a domain", "is X.com available", "domain ideas for Y"
- User is choosing between domain options and needs a structured comparison

## Workflow

### Step 1: Understand the Need

If the user provides specific domains, check them directly. If they describe a business/project, brainstorm names first considering:
- Short (ideally under 10 chars)
- Easy to spell and say aloud
- No hyphens
- Relevant to the product/industry
- Check .com and .ai as priority TLDs, then .so, .io, .dev

### Step 2: Check Availability

Use the Bash tool to call the API:
```bash
curl -s "https://domain-checker.openlabor.workers.dev/check?domains=name1.com,name1.ai,name2.com,name2.ai" | python3 -m json.tool
```

Batch multiple domains in a single call (max 20). Run multiple batches in parallel if needed.

### Step 3: Analyze & Score Available Domains

For each AVAILABLE domain, score it on these dimensions (1-10 scale):

#### Memorability (weight: 15%)
- Is it catchy? Would someone remember it after hearing it once?
- Shorter = better. One word > two words > three words
- Unique/distinctive names score higher

#### SEO Potential (weight: 20%)
- Does it contain keywords people actually search for?
- Would it rank for relevant terms?
- Avoid names that compete with unrelated high-volume searches (e.g. "unemployed" = job seekers, not AI)
- .com gets slight SEO boost over other TLDs

#### Enterprise Sales (weight: 20%)
- Would a VP/CTO feel comfortable typing this into a browser?
- Does it sound professional on a sales call or pitch deck?
- Would it look good on an invoice?
- Avoid jokes, negative words, or anything that needs explanation

#### Brand Longevity (weight: 15%)
- Will this name still work in 5 years?
- Does it scale from startup to $100M ARR?
- Is it too trendy/niche?
- Could it expand beyond the current product?

#### Social/Viral Potential (weight: 10%)
- Would people share it? Talk about it?
- Does it work as a Twitter/X handle?
- Is it meme-able or conversation-starting?

#### Emotional Tone (weight: 10%)
- What feeling does it evoke?
- Positive associations > negative ones for B2B
- Confidence, trust, capability > humor, irony

#### Phonetics (weight: 10%)
- Easy to say on a podcast or phone call?
- No ambiguous spelling ("is that with a K or C?")
- Does the TLD flow naturally? ("labor dot so" vs "labor dot A I")
- Radio test: could someone hear it and type it correctly?

### Step 4: Rank & Output

Calculate weighted score and output as a markdown table, sorted by score:

```
## Domain Analysis Results

| Rank | Domain | Score | Memo | SEO | Enterprise | Longevity | Social | Tone | Phonetics | Verdict |
|------|--------|-------|------|-----|------------|-----------|--------|------|-----------|---------|
| 1 | name.ai | 8.2 | 9 | 8 | 8 | 8 | 7 | 9 | 8 | Best overall pick |
| 2 | name.com | 7.5 | 7 | 9 | 8 | 8 | 5 | 8 | 7 | Strong SEO play |
```

Then provide:
1. **Top Pick** — the single best domain with a 2-sentence justification
2. **Runner Up** — second best with why it's close
3. **Honorable Mention** — if there's a wildcard worth considering
4. **Taken but notable** — any taken domains worth trying to acquire

## Decision Framework

Adapt scoring weights based on the business model:

- **B2B SaaS / Enterprise:** Prioritize enterprise sales + SEO + longevity. Professional > clever.
- **Consumer / Social:** Prioritize memorability + social/viral + emotional tone. Fun > corporate.
- **Developer Tools:** Prioritize phonetics + memorability. Short > descriptive. Think: Vercel, Supabase, Prisma.
- **Marketplace:** Prioritize SEO + trust/tone. Category keywords help. Think: Upwork, Fiverr.

## Anti-Patterns to Flag

- Names that SEO-compete with unrelated high-volume terms (e.g. "apple" for a fruit delivery startup)
- Negative emotional associations for B2B (unemployed, fired, bankrupt)
- Names requiring explanation ("it's a play on words...")
- Hard-to-spell names (synthwerk, kwikstaff)
- Names too close to existing brands (trademark risk)
- Uncommon TLDs without explaining trade-offs (.so is Somalia's ccTLD, less recognized than .ai/.com)

## Examples

```
User: check if labor.so and overstaffed.ai are available
→ Calls API, scores both across all 7 dimensions, outputs ranked table with verdict

User: find me a domain for an AI customer support platform
→ Brainstorms 20+ names, checks in batches, scores available ones, outputs top 5 ranked

User: is hirenoone.ai available?
→ Checks availability, analyzes the name, proactively suggests and scores alternatives

User: rate unemployed.so vs labor.so for a B2B AI workforce marketplace
→ Deep comparison across all dimensions with B2B-weighted scoring, clear winner with reasoning
```

## Notes

- Always check both .com and .ai variants — owning both is a major advantage
- Premium domains show pricing in the API response
- DNS-based checks (for .so, .io) are slightly less reliable than RDAP — note this if relevant
- If the API is down, fall back to suggesting names without availability check and tell the user to verify manually
- When brainstorming, generate names in categories: direct/descriptive, action verbs, metaphors, compound words, domain hacks
