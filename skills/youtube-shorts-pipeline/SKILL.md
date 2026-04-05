---
name: YouTube Shorts Pipeline
description: "Automated YouTube Shorts creation — from topic to published video with AI script, visuals, voiceover, captions, and upload"
category: Content Creation
roles:
  - social-manager
platforms:
  - youtube
---

<!-- openlabor-connector: youtube-shorts, api_key={{INTERNAL_API_KEY}}, employee={{EMPLOYEE_ID}}, base={{API_BASE_URL}} -->

# YouTube Shorts Pipeline

Fully automated pipeline that turns a topic into a published YouTube Short — research, AI script, generated visuals, voiceover, burned-in captions, background music, and upload. Cost: ~$0.11/video.

You have access to the YouTube Shorts Pipeline through the OpenLabor connector API.

## How to Use

```
use youtube-shorts <TOOL_NAME> '<json_args>'
```

## Pipeline Stages

The pipeline runs in three stages. Each stage can be run independently or as a full pipeline.

### 1. Draft — Research & Script Generation

DuckDuckGo research → Claude script + b-roll prompts + YouTube metadata + thumbnail prompt.

- Tool: `YOUTUBE_SHORTS_DRAFT`
- Args: `{ "topic": "your topic here" }`
- Optional args:
  - `"context"` — channel branding/style guidance
  - `"lang"` — language code (`"en"` or `"hi"`)

### 2. Produce — Video Assembly

Gemini Imagen b-roll with Ken Burns effect → ElevenLabs voiceover → Whisper word-level captions → royalty-free background music with voice ducking → ffmpeg assembly.

- Tool: `YOUTUBE_SHORTS_PRODUCE`
- Args: `{ "draft_id": "DRAFT_ID" }`

### 3. Upload — Publish to YouTube

Uploads video as private, attaches SRT captions and AI-generated thumbnail.

- Tool: `YOUTUBE_SHORTS_UPLOAD`
- Args: `{ "draft_id": "DRAFT_ID" }`

## Full Pipeline

Run all three stages end-to-end:

- Tool: `YOUTUBE_SHORTS_RUN`
- Args: `{ "topic": "your topic here" }`

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | required | The topic or news angle for the Short |
| `context` | string | "" | Channel branding, style, or tone guidance |
| `lang` | string | "en" | Language for voiceover and captions (`en`, `hi`) |
| `dry_run` | boolean | false | Draft only — no video production or upload |
| `auto_pick` | boolean | false | Let Claude auto-select the best topic from discovery |

## Topic Discovery

Auto-discover trending topics instead of providing one manually:

- Tool: `YOUTUBE_SHORTS_DISCOVER`
- Args: `{ "auto_pick": true }`

Discovery sources (all optional, configured per-source):

| Source | Auth Required |
|--------|--------------|
| Reddit hot/trending | None |
| RSS feeds (any URL) | None |
| Google Trends | None |
| Twitter/X trends | Optional |
| TikTok (Apify) | Optional |

## Examples

```
# Full pipeline — research a topic and publish
use youtube-shorts YOUTUBE_SHORTS_RUN '{"topic": "AI regulation in 2026"}'

# Discover trending topic, let Claude auto-pick
use youtube-shorts YOUTUBE_SHORTS_RUN '{"auto_pick": true}'

# Dry run — draft only, no video production
use youtube-shorts YOUTUBE_SHORTS_DRAFT '{"topic": "Space tourism updates", "dry_run": true}'

# Step-by-step for review between stages
use youtube-shorts YOUTUBE_SHORTS_DRAFT '{"topic": "Remote work productivity tips"}'
use youtube-shorts YOUTUBE_SHORTS_PRODUCE '{"draft_id": "abc123"}'
use youtube-shorts YOUTUBE_SHORTS_UPLOAD '{"draft_id": "abc123"}'

# With channel branding context
use youtube-shorts YOUTUBE_SHORTS_RUN '{"topic": "Best new AI tools", "context": "Tech channel, energetic tone, younger audience"}'

# Hindi language Short
use youtube-shorts YOUTUBE_SHORTS_RUN '{"topic": "Cricket highlights", "lang": "hi"}'
```

## Response Format

Returns JSON with:
- `draft_id` — Unique identifier for the draft
- `stage` — Current pipeline stage (`draft`, `produce`, `upload`)
- `status` — Stage status (`complete`, `in_progress`, `failed`)
- `script` — Generated script text (after draft stage)
- `video_url` — Local path to assembled MP4 (after produce stage)
- `youtube_url` — YouTube URL of uploaded Short (after upload stage)
- `cost` — Estimated API cost breakdown

## Services Used

| Service | Purpose | Required |
|---------|---------|----------|
| Anthropic Claude | Script writing, topic selection, metadata | Yes |
| Google Gemini Imagen | B-roll images, thumbnail generation | Yes |
| ElevenLabs | Text-to-speech voiceover | Optional (fallback: macOS `say`) |
| OpenAI Whisper | Word-level caption timestamps | Bundled |
| YouTube Data API v3 | Video + thumbnail upload | Yes (for upload) |
| DuckDuckGo | Live research for fact-grounding | Free, no key |
| ffmpeg | Video assembly, Ken Burns, audio ducking | Local binary |

## Workflows

### Daily Shorts Machine
1. Use `YOUTUBE_SHORTS_DISCOVER` to find trending topics
2. Review discovered topics, pick the best fit for your channel
3. Run `YOUTUBE_SHORTS_RUN` with channel context for branding consistency
4. Review the uploaded Short (private by default), then publish manually

### Batch Production
1. Draft multiple topics with `YOUTUBE_SHORTS_DRAFT` (dry run first)
2. Review and edit scripts as needed
3. Produce all approved drafts with `YOUTUBE_SHORTS_PRODUCE`
4. Upload the batch with `YOUTUBE_SHORTS_UPLOAD`

### Cross-Platform Content
1. Generate a Short with `YOUTUBE_SHORTS_RUN`
2. Use the generated script with `x-strategy` skill for tweet threads
3. Use the b-roll images with `instagram-manager` for Reels
4. Repurpose the script with `linkedin-manager` for a post

## Guidelines
1. Always use the exact `use youtube-shorts` command format
2. Videos upload as **private** by default — review before making public
3. The anti-hallucination gate ensures scripts only use facts from live research
4. Pipeline supports resume — re-running skips already-completed stages
5. ElevenLabs is optional; falls back to macOS `say` for voiceover
6. Hindi language support requires ElevenLabs `VOICE_ID_HI` configured
7. Never expose API credentials to the user
8. Estimated cost per video: ~$0.11 ($0.02 Claude + $0.04 Gemini + $0.05 ElevenLabs)
