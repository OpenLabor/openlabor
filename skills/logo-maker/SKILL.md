---
name: logo-maker
description: Generate professional logomarks and wordmarks using AI image generation
triggers:
  - "make a logo"
  - "create logo"
  - "design logo"
  - "generate logo"
  - "logo for"
  - "brand mark"
  - "logomark"
argument-hint: "<brand name and description>"
---

# Logo Maker

Generate professional, minimal logomarks and wordmarks using Flux (via Replicate) and Imagen (via Google AI). Produces multiple concepts with variations, then helps refine the winner.

## API Keys

Load from environment or `.env` file in the skill directory:
```
REPLICATE_API_TOKEN=...
GOOGLE_AI_API_KEY=...
```

## When to Activate

- User asks to create, design, or generate a logo
- User describes a brand and needs visual identity
- User wants logo variations or refinements

## Workflow

### Step 1: Understand the Brand

Before generating anything, gather:
- **Brand name** (exact text for the wordmark)
- **What it does** (one sentence)
- **Audience** (B2B enterprise, consumer, developer, etc.)
- **Vibe** (minimal, bold, playful, technical, premium, etc.)
- **Constraints** (must work at 16x16 favicon, specific colors, etc.)

If the user hasn't provided these, ask. Keep it to 2-3 targeted questions max.

### Step 2: Craft the Prompt

Logo generation requires very specific prompts. Follow this formula:

**For logomarks (icon/symbol):**
```
Minimal geometric logomark for "[Brand]" — [what it does]. Abstract symbol suggesting [2-3 concepts].
Single color on white background. Vector style, flat design, no gradients, no shadows, no text.
Clean lines, works at 16x16px. Professional, modern, [vibe].
```

**For wordmarks (text-based):**
```
Clean typographic logo for "[Brand]" in lowercase [or uppercase]. Modern sans-serif typeface
similar to [Inter/Geist/Helvetica]. [Weight] weight. Minimal, no icon, no decoration.
Black on white background. Professional, [vibe].
```

**For combination marks (icon + text):**
```
Minimal logo for "[Brand]" — [what it does]. Small geometric symbol to the left of the wordmark.
Symbol suggests [concept]. Wordmark in clean lowercase sans-serif. Single color on white background.
Vector style, flat design. Professional, modern.
```

### Step 3: Generate with Replicate (Flux)

Models available:
- `black-forest-labs/flux-2-pro` — highest quality Flux model, use for final deliverables
- `google/nano-banana-pro` — Google Nano Banana Pro, strong alternative style

**Option A: Using the Replicate JS SDK (recommended)**

```bash
# Set API token
export REPLICATE_API_TOKEN=$REPLICATE_API_TOKEN
```

```javascript
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

// Flux 2 Pro (highest quality)
const output = await replicate.run("black-forest-labs/flux-2-pro", {
  input: {
    prompt: "YOUR_PROMPT_HERE",
    aspect_ratio: "1:1",
    output_format: "png",
    safety_tolerance: 2
  }
});

console.log(output.url());
await writeFile(`${project}_${angleName}_v1_flux2pro.png`, output);
```

```javascript
// Nano Banana Pro (alternative style)
const output = await replicate.run("google/nano-banana-pro", {
  input: {
    prompt: "YOUR_PROMPT_HERE",
    num_outputs: 4,
    aspect_ratio: "1:1",
    output_format: "png"
  }
});

for (let i = 0; i < output.length; i++) {
  console.log(output[i].url());
  await writeFile(`${project}_${angleName}_v${i + 1}_nano-banana.png`, output[i]);
}
```

**Option B: Using curl**

```bash
# Flux 2 Pro (highest quality)
curl -s -X POST "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: wait" \
  -d '{
    "input": {
      "prompt": "YOUR_PROMPT_HERE",
      "aspect_ratio": "1:1",
      "output_format": "png",
      "safety_tolerance": 2
    }
  }'
```

```bash
# Nano Banana Pro (alternative style)
curl -s -X POST "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: wait" \
  -d '{
    "input": {
      "prompt": "YOUR_PROMPT_HERE",
      "num_outputs": 4,
      "aspect_ratio": "1:1",
      "output_format": "png"
    }
  }'
```

Download output images:
```bash
curl -sL "IMAGE_URL" -o {project}_{anglename}_v1_flux2pro.png
```

### Step 4: Generate with Google Imagen 4 (alternative)

Use Imagen 4.0 via Google AI for a different style. Three tiers available:
- `imagen-4.0-fast-generate-001` — fastest, good for drafts
- `imagen-4.0-generate-001` — balanced quality/speed
- `imagen-4.0-ultra-generate-001` — highest quality, use for final deliverables

```bash
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=$GOOGLE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{"prompt": "YOUR_PROMPT_HERE"}],
    "parameters": {
      "sampleCount": 4,
      "aspectRatio": "1:1"
    }
  }'
```

Response contains base64-encoded images in `predictions[].bytesBase64Encoded`. Save them:
```bash
echo "BASE64_DATA" | base64 -d > logo_google_1.png
```

For extracting and saving all images from the response:
```bash
python3 -c "
import json, base64, sys
data = json.load(sys.stdin)
for i, pred in enumerate(data.get('predictions', [])):
    img = base64.b64decode(pred['bytesBase64Encoded'])
    fname = f'{project}_{anglename}_v{i+1}_imagen4.png'
    with open(fname, 'wb') as f:
        f.write(img)
    print(f'Saved {fname}')
"
```

### Step 5: Present and Compare

Always generate from BOTH Replicate and Google, then present all options:

```
## Logo Concepts for [Brand]

### Flux Generations
1. [image] — Description of what this conveys
2. [image] — Description
3. [image] — Description
4. [image] — Description

### Imagen Generations
1. [image] — Description
2. [image] — Description
3. [image] — Description
4. [image] — Description

### Recommendation
**Top pick:** #X — [why this works best for the brand]
**Runner up:** #Y — [what makes it strong]
```

### Step 6: Refine

Once the user picks a direction, refine with:
- **More specific prompt** — add details from the chosen concept
- **Variations** — "similar to [concept] but with [adjustment]"
- **Color versions** — generate in brand colors
- **Size tests** — generate at different aspect ratios (1:1 for favicon, 16:9 for header)

## Prompt Engineering Tips

**DO:**
- Say "minimal", "geometric", "flat design", "vector style"
- Specify "single color on white background"
- Reference specific typefaces (Inter, Geist, Helvetica Neue)
- Include "works at 16x16px" for favicons
- Say "no gradients, no shadows, no 3D effects"

**DON'T:**
- Use vague terms like "creative" or "unique"
- Ask for too many elements in one mark
- Include detailed scenes or illustrations
- Request specific pantone colors (describe the color instead)
- Say "logo" without specifying logomark vs wordmark vs combination

## Logo Evaluation Criteria

When comparing options, evaluate on:

| Dimension | Weight | What to look for |
|-----------|--------|-----------------|
| Simplicity | 25% | Can you draw it from memory? Does it work at 16x16? |
| Distinctiveness | 20% | Would you confuse it with another brand? |
| Relevance | 20% | Does it suggest what the company does? |
| Versatility | 15% | Works on dark/light, small/large, print/screen? |
| Timelessness | 10% | Will it look dated in 3 years? |
| Memorability | 10% | Would someone recognize it after seeing it once? |

## Examples

```
User: make a logo for Labor — an AI workforce platform
-> Generate 4 Flux + 4 Imagen concepts using:
   "Minimal geometric logomark for 'Labor'. Abstract symbol suggesting
   forward momentum and productive force. Single color on white background.
   Vector style, flat design, no gradients, no shadows, no text.
   Clean angles, works at 16x16px. Professional, modern, confident."

User: I like #3 but make it more angular
-> Refine prompt: add "sharp angles, no curves, angular geometry"
-> Generate 4 more variations

User: now make the full logo with the wordmark
-> Switch to combination mark prompt with the chosen symbol style
```

## File Naming Convention

**All generated images MUST follow this naming pattern:**

```
{project}_{anglename}_{variation}_{model}.png
```

| Segment | Description | Examples |
|---------|-------------|----------|
| `project` | Brand/project name, lowercase | `openlabor`, `acme` |
| `anglename` | Concept angle/idea, lowercase with hyphens | `circuit-tie`, `badge-smiley`, `briefcase-open`, `plaque-eotm` |
| `variation` | Variation number | `v1`, `v2`, `v3` |
| `model` | Model used for generation | `flux2pro`, `nano-banana`, `imagen4`, `imagen4-fast`, `imagen4-ultra` |

**Examples:**
```
openlabor_circuit-tie_v1_flux2pro.png
openlabor_circuit-tie_v2_nano-banana.png
openlabor_badge-smiley_v1_flux2pro.png
openlabor_briefcase-open_v1_imagen4.png
acme_wordmark-serif_v3_flux2pro.png
```

**Rules:**
- Always lowercase, no spaces — use hyphens within segments, underscores between segments
- Increment variation numbers per angle per model (v1, v2, v3...)
- When refining a concept, keep the same anglename and increment the variation
- Save all files to the project's designated output directory

## Notes

- Always generate from both APIs — they have very different styles
- Flux is better at geometric/abstract marks
- Imagen 4 is better at text rendering and typography
- Save all generated images locally for the user
- If an API is down or rate-limited, continue with the other one
- For final deliverables, use Flux 2 Pro or Imagen 4 Ultra
- Prefer the Replicate JS SDK when running in a Node environment — simpler than polling curl
