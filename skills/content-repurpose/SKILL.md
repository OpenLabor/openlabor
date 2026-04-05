---
name: Content Repurpose Pipeline
description: "Atomize one piece of content into platform-native posts for X, LinkedIn, Instagram, Reddit, and YouTube — with viral scoring and dedup"
category: Content Creation
roles:
  - writer
  - x-manager
  - cmo
  - social-manager
platforms:
  - x
  - linkedin
  - instagram
  - reddit
  - youtube
---

<!-- openlabor-connector: x, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->
<!-- openlabor-connector: linkedin, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->
<!-- openlabor-connector: instagram, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->
<!-- openlabor-connector: reddit, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->
<!-- openlabor-connector: images, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# Content Repurpose Pipeline

One input. Ten to fifteen platform-native content pieces. Distributed across five platforms in seven days.

Most teams rewrite the same paragraph for each platform and wonder why nothing gets engagement. This skill does something different: it atomizes content into its smallest valuable units — insights, stories, data points, frameworks, hot takes, quotes — then adapts each atom to platform culture, scores it for viral potential, deduplicates against recent posts, and optionally publishes via connectors.

You are a content repurposing specialist. Your job is to extract maximum reach from a single piece of content without copy-pasting across platforms.

## Why This Works

- One long-form piece contains 8-15 distinct content atoms. Most teams surface 1-2.
- Platform-native content outperforms copy-pasted content by 3-5x in engagement
- Content atoms are reusable across multiple repurposing cycles as evergreen assets
- Systematic scoring cuts guesswork and prioritizes the pieces most likely to spread

## The Pipeline

```
Step 1: Ingest → Accept any input format, extract raw material
Step 2: Atomize → Break into 6 types of content units
Step 3: Adapt → Generate platform-native versions per atom
Step 4: Score → Calculate viral potential, cut pieces below threshold
Step 5: Dedup → Compare against recent posts, flag duplicates
Step 6: Schedule → Build 7-day content calendar
Step 7: Publish → Post via connectors with user approval
```

---

## Step 1 — Content Ingestion

Accept input in any of these formats:

| Format | How to Ingest |
|--------|--------------|
| URL (article, blog post) | `use research JINA_READ '{"url":"[URL]"}'` |
| Pasted text | Use directly |
| Podcast/video transcript | Paste or upload text file |
| PDF | Extract text content |
| Newsletter | Paste full HTML or plain text |

### What to Extract

After ingesting, scan for these raw materials:

- **Key claims** — The main arguments or positions taken
- **Data points** — Specific numbers, percentages, survey results, case study results
- **Quotable lines** — Sentences memorable enough to screenshot
- **Frameworks** — Step-by-step processes, models, checklists
- **Stories** — Anecdotes with a setup, tension, and resolution
- **Contrarian takes** — Any claim that challenges conventional wisdom
- **Predictions** — Forward-looking statements with a stake in the ground
- **Definitions** — Novel ways of defining familiar concepts

Aim to extract at least 10-15 raw items before moving to Step 2.

---

## Step 2 — Content Atom Extraction

Organize raw material into six atom types. Each type maps to different platform strategies.

### Atom Types

**Insight** — A standalone observation that is true, non-obvious, and immediately useful.
- Example: "Most newsletters lose 40% of readers in the first paragraph, not the subject line."
- Best for: Tweets, LinkedIn text posts, Reddit value posts

**Story** — A narrative moment with a clear setup, something that changed, and a takeaway.
- Example: "We cut our onboarding from 14 steps to 3. Activation went up 60%. Here's what we removed."
- Best for: Threads, LinkedIn long-form, carousel slides

**Data Point** — A specific number or stat that changes how people understand something.
- Example: "Cold outreach referencing a specific pain point gets 11% reply rates vs 0.3% for generic."
- Best for: Visual posts, quote cards, tweet singles, Instagram carousels

**Framework** — A repeatable process, model, or decision structure.
- Example: "The 4-step content atom system: Extract → Adapt → Score → Dedup"
- Best for: Threads, carousels, LinkedIn how-to posts, YouTube Shorts

**Hot Take** — A contrarian or opinion-driven claim designed to trigger a reaction.
- Example: "Scheduling posts in advance is why your content feels dead."
- Best for: Engagement-first tweets, LinkedIn opinion posts, Reddit discussion threads

**Quote** — A one-liner pulled verbatim or lightly edited from the source.
- Example: "The algorithm doesn't reward consistency. It rewards relevance."
- Best for: Quote cards, standalone tweets, Instagram single-image posts

### Atom Extraction Template

For each atom, document:

| Field | Value |
|-------|-------|
| Atom ID | `A-001`, `A-002`, ... |
| Type | insight / story / data-point / framework / hot-take / quote |
| Core text | The raw atom in 1-3 sentences |
| Source context | Where in the original content it came from |
| Platforms suited | Which platforms this atom fits |
| Used before | Yes / No (dedup flag) |

---

## Step 3 — Platform Adaptation

For each atom, generate a platform-native version. Native means adapting TONE and STRUCTURE, not just trimming length. Reddit is anti-marketing. LinkedIn rewards professional vulnerability. X rewards provocation and compression. Instagram rewards visuals and emotion. YouTube Shorts rewards fast payoff.

---

### X / Twitter

Single Tweet:
- Under 280 characters
- Hook in the first 8 words — make a claim, share a number, or ask a question
- No thread indicator unless it is a thread
- Avoid hashtags (they signal spam to the algorithm)

```
use x TWITTER_CREATION_OF_A_POST '{"text":"[TWEET_TEXT]"}'
```

Thread (for Story or Framework atoms):
- Tweet 1: Curiosity gap opener — the payoff, not the setup
- Tweets 2-8: Build the case, one point per tweet
- Tweet 9-10: Actionable takeaway + engagement CTA
- Each tweet must stand alone as readable

```
use x TWITTER_CREATION_OF_A_POST '{"text":"[TWEET_1]"}'
```

Repeat for each tweet in the thread, linking replies manually or using thread scheduling tools.

**X tone guide:** Punchy, direct, slightly provocative. No filler. Cut every sentence in half and see if it is stronger.

---

### LinkedIn

Text Post (for Insight, Story, or Hot Take atoms):
- Line 1: The hook. One sentence. Stop before "see more." Make it impossible to scroll past.
- Lines 2-6: The story or argument. Short paragraphs. One idea per paragraph.
- Lines 7-9: The takeaway. Concrete. Actionable.
- Last line: A question or CTA that invites comments.
- Total: Under 3000 characters. Ideal range: 800-1500.

```
use linkedin LINKEDIN_CREATE_LINKED_IN_POST '{"text":"[FULL_POST_TEXT]"}'
```

**LinkedIn tone guide:** Professional but human. The best LinkedIn posts read like a thoughtful colleague sharing a lesson — not a marketing department announcing a win. Vulnerability and specificity outperform polish.

---

### Instagram

Instagram requires two steps: generate the image, then publish the post.

**Carousel post** (for Framework or Story atoms, 5-10 slides):

Slide structure:
- Slide 1: Hook slide — bold claim or provocative question, high contrast design
- Slides 2-8: One key point per slide, minimal text, strong visual metaphor
- Last slide: CTA — "Save this", "Share with someone who needs this", or follow prompt

Generate image for each slide:

```
use images GENERATE '{"prompt":"[DETAILED_IMAGE_PROMPT_FOR_SLIDE_N]","aspect_ratio":"1:1"}'
```

Image prompt guidelines:
- Specify: style (bold flat design / editorial / minimalist), colors, text overlay content, mood
- Example: "Bold flat design, dark navy background, white sans-serif text reading '[SLIDE_TEXT]', abstract geometric accent, high contrast, Instagram carousel style"

Publish each slide as part of the carousel sequence. For single-image posts (Quote atoms):

```
use images GENERATE '{"prompt":"[QUOTE_CARD_PROMPT]","aspect_ratio":"1:1"}'
```

Then post with caption:
- First line: The hook (same as the slide 1 text)
- Body: 3-5 lines of context or story
- Close: 3-5 relevant hashtags on a separate line (Instagram hashtags still work)

**Instagram tone guide:** Emotional, visual, aspirational. Captions can be longer than on X but must earn every line. Avoid corporate language entirely.

---

### Reddit

Native text post (for Insight, Data Point, or Framework atoms):
- Title: Specific, curiosity-driven, value-first. Never promotional.
- Body: Share the insight as if you discovered it yourself and are sharing with the community
- Format: Use Reddit markdown — headers, bullet points, short paragraphs
- End with a genuine question to the community
- No links in first post unless directly relevant
- Target specific subreddits where this insight is genuinely useful

```
use reddit REDDIT_CREATE_REDDIT_POST '{"title":"[POST_TITLE]","text":"[POST_BODY]","subreddit":"[SUBREDDIT_NAME]"}'
```

**Reddit tone guide:** Reddit is violently anti-promotion. Write like a community member sharing something useful, not a brand distributing content. If it reads like a press release, it will be downvoted immediately. Add specificity, acknowledge limitations, invite pushback.

Subreddit targeting examples:
- Productivity insight → r/productivity, r/getdisciplined
- Marketing data → r/marketing, r/startups, r/entrepreneur
- Tech framework → r/programming, r/webdev, r/SideProject

---

### YouTube Shorts

Script outline (for Story or Framework atoms, 30-60 seconds):

```
[0-3s]   Hook — Start mid-sentence or with the payoff. "We cut our team in half and tripled revenue. Here is how."
[3-15s]  Setup — Minimum context needed to understand the story
[15-45s] Substance — The 3-5 key points or steps, fast-paced
[45-55s] Payoff — The result or the lesson
[55-60s] CTA — "Follow for more" or "Comment your take"
```

For full Shorts production (voiceover, visuals, editing), hand off to the YouTube Shorts Pipeline skill.

**YouTube Shorts tone guide:** Fast. No filler. Every second must earn the next. Front-load the payoff — viewers decide in 3 seconds whether to keep watching.

---

## Step 4 — Viral Scoring

Score every piece before it goes on the calendar. Cut anything below threshold.

### Scoring Formula

```
Viral Score = (Novelty × 0.3) + (Emotion × 0.3) + (Utility × 0.2) + (Shareability × 0.2)
```

Score each dimension 1-10:

| Dimension | Score 1 | Score 10 |
|-----------|---------|----------|
| **Novelty** | Everyone already knows this | Reframes something familiar in a way people haven't seen |
| **Emotion** | Flat, informational | Triggers a strong reaction: surprise, validation, anger, inspiration |
| **Utility** | Abstract, hard to apply | Immediately actionable today |
| **Shareability** | Useful only to the reader | Makes the reader look smart or caring by sharing it |

### Scoring Thresholds

| Score | Action |
|-------|--------|
| 8.0 - 10.0 | Priority — publish first, invest in visual quality |
| 6.0 - 7.9 | Publish — standard quality is fine |
| 5.0 - 5.9 | Revise or hold — improve the hook or angle |
| Below 5.0 | Cut — do not publish |

Score every piece independently. A Framework atom may score 8 on X but 5 on Reddit if the framing is too polished for that community.

---

## Step 5 — Dedup Check

Before publishing, compare each piece against recently published content.

### Dedup Rules

- Never post the same core insight to the same platform within 30 days
- Never post identical content to multiple platforms simultaneously
- Reframing the same insight with a different angle is acceptable after 14 days
- Track at the atom level — if Atom A-003 has been published as a tweet, flag it before turning it into a LinkedIn post in the same week

### Dedup Log Format

| Atom ID | Platform | Published Date | Format | Status |
|---------|----------|---------------|--------|--------|
| A-001 | X | 2024-01-15 | Single tweet | Published |
| A-001 | LinkedIn | — | Text post | Scheduled |
| A-003 | X | 2024-01-10 | Thread tweet 2 | Published |
| A-003 | Reddit | — | Text post | Cleared |

If an atom has been used on a platform recently, either adapt it significantly or move it to a later week.

---

## Step 6 — Publishing Schedule

Distribute the approved pieces across a 7-day calendar. Stagger platforms to avoid flooding any single audience.

### Suggested Weekly Pattern

| Day | Primary | Secondary |
|-----|---------|-----------|
| Monday | LinkedIn text post | Tweet (insight) |
| Tuesday | X thread | Reddit text post |
| Wednesday | Instagram carousel | Tweet (data point) |
| Thursday | LinkedIn text post | Tweet (hot take) |
| Friday | YouTube Short script | Tweet (quote card) |
| Saturday | Instagram single image | — |
| Sunday | Retweet / engage | — |

### Posting Time Guidelines by Platform

| Platform | Best Times (local audience timezone) |
|----------|--------------------------------------|
| X / Twitter | 8-10am, 12-1pm, 5-7pm weekdays |
| LinkedIn | Tuesday-Thursday, 7-9am or 12-1pm |
| Instagram | 11am-1pm, 7-9pm any day |
| Reddit | 9am-12pm weekdays (varies by subreddit) |
| YouTube Shorts | Upload any time — algorithm distributes |

Adjust based on your specific audience's engagement data.

---

## Step 7 — Optional Auto-Post

With explicit user approval, post directly via platform connectors. Always confirm the full content list before posting anything.

Confirmation format before posting:

```
Ready to publish [N] pieces across [platforms].
Posting order: [list by day and platform]
Confirm? (yes / review each / cancel)
```

Never post without confirmation. Never post to platforms where the connector is not configured.

---

## Complete Example

**Input:** A 500-word blog post about why most email newsletters fail in the first paragraph.

**Content Atoms Extracted:**

| ID | Type | Core Text |
|----|------|-----------|
| A-001 | Data Point | 40% of newsletter readers bounce in the first paragraph |
| A-002 | Insight | Subject lines get blamed for low open rates, but the first line causes most unsubscribes |
| A-003 | Framework | The 3-part newsletter opening: the promise, the stakes, the first value |
| A-004 | Hot Take | If your newsletter starts with "Welcome to this week's edition" you've already lost |
| A-005 | Story | Switched one client's opening sentence, open-to-read rate went from 20% to 61% |
| A-006 | Quote | "The first line of a newsletter is a promise. The second line proves you can keep it." |

**12 Pieces Generated:**

| # | Platform | Format | Atom | Viral Score |
|---|----------|--------|------|-------------|
| 1 | X | Single tweet | A-004 (hot take) | 8.4 |
| 2 | X | Thread (8 tweets) | A-003 (framework) | 7.9 |
| 3 | X | Single tweet | A-001 (data point) | 7.2 |
| 4 | LinkedIn | Text post | A-005 (story) | 8.1 |
| 5 | LinkedIn | Text post | A-002 (insight) | 6.8 |
| 6 | Instagram | Carousel (6 slides) | A-003 (framework) | 7.6 |
| 7 | Instagram | Quote card | A-006 (quote) | 6.5 |
| 8 | Reddit | Text post | A-002 (insight) | 7.0 |
| 9 | Reddit | Text post | A-001 (data point) | 6.4 |
| 10 | X | Single tweet | A-006 (quote) | 6.1 |
| 11 | LinkedIn | Text post | A-004 (hot take) | 5.8 |
| 12 | YouTube Shorts | Script outline | A-005 (story) | 7.7 |

**Cut:** None — all pieces scored above 5.0.

**Priority posts (score 8+):** #1 (X hot take), #4 (LinkedIn story), → scheduled Monday and Tuesday first.

**7-Day Calendar:**

```
Mon: LinkedIn story post (#4) + X hot take (#1)
Tue: X thread (#2) + Reddit insight (#8)
Wed: Instagram carousel (#6) + X data tweet (#3)
Thu: LinkedIn insight (#5) + Reddit data post (#9)
Fri: YouTube Short script (#12) + X quote tweet (#10)
Sat: Instagram quote card (#7)
Sun: [Engage and reply]
```

---

## Humanizer Pass

Before finalizing any piece, run the Content Humanizer check:

- Remove corporate filler: "leverage", "synergy", "empower", "exciting", "game-changing"
- Add specificity: replace "many companies" with a number or named example
- Cut throat-clearing openers: never start with "In today's fast-paced world" or "I'm thrilled to share"
- Match platform energy: Reddit sarcasm is different from LinkedIn warmth is different from X bluntness
- Read it aloud — if it sounds like an AI wrote it, rewrite the first sentence

---

## Sourcing & Attribution Rules

- When repurposing someone else's content: credit the source in the post ("via @handle" or "from [Source]")
- When repurposing your own content: no attribution needed, but note the original publication date
- Never republish large blocks of verbatim text from others — paraphrase and cite
- Data points from third-party research: always cite the research source

---

## Guidelines

- Platform-native means adapting tone, structure, and format — not just length
- Never post identical content to multiple platforms. Ever.
- Score before scheduling — do not publish pieces below 5.0 out of hope
- Run the dedup check against the last 30 days of published content minimum
- Images for Instagram are required — text-only carousels perform significantly worse
- For Reddit: read the target subreddit's top posts before writing. Match their style.
- Always confirm before auto-posting. A wrong post is harder to undo than a delayed one.
- The pipeline runs best on long-form inputs (500+ words). Shorter inputs produce fewer atoms.
- One repurpose cycle per piece of content. Run the pipeline again in 60 days with fresh angles.
