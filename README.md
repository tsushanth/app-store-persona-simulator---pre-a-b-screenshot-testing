# App Store Persona Simulator — Pre-A/B Screenshot Testing

A local CLI that simulates how distinct user personas (busy parent, hardcore gamer,
productivity nerd) perceive your App Store listing *before* you spend money on real
A/B screenshot tests.

Give it a folder of screenshots and a text description. For each persona it produces:

- a first-impression critique, in that persona's voice
- a rewritten headline/caption suggestion
- a plain-text "visual variant" suggestion (a description of what to change, not a
  generated image)
- an install-intent score (1–10)

It also OCRs the text baked into each screenshot (Apple now indexes this for search)
and checks how much of your description's keywords actually show up in your
screenshots — text your listing "says" but your screenshots don't reinforce is a gap.

Personas are ranked at the end by predicted install intent, so you know who your
current listing sells best — and who it's losing.

This is a local proof-of-concept scaffold, not a hosted product: no accounts, no
billing, no database, no image generation. See `plan.md` for the full scope and
what was deliberately left out.

## How it works

1. `ocr.ts` runs each screenshot through `tesseract.js` (WASM OCR, no native
   Tesseract install required) to extract its visible text.
2. `keywordDensity.ts` compares the description's keywords against that OCR'd text
   and reports what's missing.
3. `simulate.ts` sends each persona's voice/priorities, your description, and the
   OCR'd screenshot text to Claude, and asks it to respond in-character as that
   persona with a critique, a rewritten headline, a visual variant suggestion, and
   an install-intent score.
4. `report.ts` assembles everything into one Markdown report, ranked by score.

## Requirements

- Node.js 20+
- An Anthropic API key (the persona simulation calls Claude — this is the one part
  of the demo that can't be faked, since the whole point is proving a real model can
  produce differentiated, persona-specific judgment)

## Setup

```bash
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
export $(cat .env | xargs)
```

## Run

Sample input (a fictional workout app) is included under `sample-input/`:

```bash
npx tsx src/cli.ts \
  --screenshots ./sample-input/screenshots \
  --description ./sample-input/description.txt \
  --out ./out/report.md
```

Then open `out/report.md`.

To try it on your own app, point `--screenshots` at a folder of your own PNG/JPG
screenshots and `--description` at a text file with your real App Store description.

## Tests

Pure-logic unit tests (no network calls, no API key needed):

```bash
npm test
```

Covers `keywordDensity.ts` (density/coverage math), `personas.ts` (schema sanity
check on the fixed persona list), and `report.ts` (ranking order in the assembled
Markdown).

## Project layout

```
src/
├── cli.ts             # entry point: parses args, orchestrates the run
├── personas.ts         # fixed persona definitions (name, voice, priorities)
├── ocr.ts              # wraps tesseract.js: screenshot -> extracted text
├── keywordDensity.ts    # pure function: (description, ocrText[]) -> density report
├── simulate.ts          # builds the persona prompt, calls Claude, parses response
└── report.ts            # assembles all results into one Markdown report + ranking
sample-input/
├── description.txt      # sample App Store description
└── screenshots/          # sample screenshots to test with
```

`out/` (gitignored) is where generated reports land.
