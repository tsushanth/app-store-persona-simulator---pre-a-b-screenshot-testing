# App Store Persona Simulator — Local MVP Scaffold Plan

## Goal of this scaffold

Prove the one thing no competitor (AppScreenshotStudio, AppDrift, AppLaunchFlow) does:
simulate how a specific *human persona* reads an App Store listing and decides
whether to install — not just template generation or keyword tracking.

A single local CLI run should take a folder of screenshots + a description,
and output a Markdown report containing, per persona:
- a first-impression critique in that persona's voice
- a rewritten headline/caption suggestion
- a plain-text "visual variant" suggestion (not a generated image)
- an install-intent score (1-10)
- OCR'd text pulled from each screenshot + a naive keyword-density check against the description

Personas are ranked at the end by predicted install intent so the dev knows
which persona is most/least sold by the current listing.

## 1. Stack choice

**Node.js + TypeScript, run via `tsx` (no build step), single CLI file + a few helper modules.**

Why this over alternatives:
- Python is arguably just as light, but Node lets us use `tesseract.js`, which bundles
  its OCR engine as WASM — no system-level `tesseract` binary to install. That matters
  because "Apple OCR-indexes screenshots now" is the whole fresh angle of this idea, so
  the demo has to actually OCR something, not stub it. A Python route would need a
  system Tesseract install, which is one more thing that can break the "just run it" demo.
- One language, no framework, no server. `tsx src/cli.ts ...` is the entire runtime.
- The persona simulation itself is the core value and it must call a real LLM
  (Claude, via `@anthropic-ai/sdk`) — canned/mocked persona text would not actually
  prove personas produce differentiated, useful critiques. This is the one place
  where "no code without justification" is overridden: an API key is required because
  the core value (a model reasoning as a persona) is impossible to demonstrate otherwise.
  The key is read from `ANTHROPIC_API_KEY` in the environment — no login, no account
  system, no key management UI.

Dependencies (minimal):
- `@anthropic-ai/sdk` — persona critique/rewrite/scoring generation
- `tesseract.js` — local OCR of screenshot text (no native binary)
- `commander` — CLI argument parsing
- `sharp` (optional, only if we need basic image resizing before OCR for speed/accuracy)

No web framework, no database driver, no ORM, no test framework beyond Node's built-in
`node:test` for the couple of pure-logic units worth unit testing.

## 2. Explicitly out of scope for this local demo

- **Auth / accounts** — not needed; it's a CLI run by the one developer using it.
- **Billing / subscriptions / Stripe** — pricing model ($15/mo or per-report) is a business
  decision for later, irrelevant to proving the core simulation works.
- **Hosting / deployment** — runs on localhost only, no server process, no cloud function.
- **A real App Store scraper / App Store Connect API integration** — out of scope; input
  is local files (screenshots + a text file) the user already has, not a live listing pull.
- **Actual image generation for "visual variant suggestions"** — the real product might
  eventually generate a modified screenshot image; the demo only needs to prove the
  *judgment* (what to change and why), so variant suggestions are text descriptions,
  not rendered images.
- **Persistence / history / multi-report storage** — each run just writes one Markdown
  report to disk; no database, no report library, no comparison-over-time feature.
- **Reddit/IndieHackers distribution, testimonials, etc.** — go-to-market, not the scaffold.
- **Configurable/custom persona builder UI** — personas are a small fixed set defined in
  a local JSON/TS file for the demo (e.g. busy parent, hardcore gamer, productivity nerd).
  Editing that file to add a persona is enough; no UI is needed to prove the concept.

## 3. File / directory layout

```
app-store-persona-simulator-pre-a-b-screenshot-tes/
├── plan.md                       # this file
├── package.json
├── tsconfig.json
├── .env.example                  # documents ANTHROPIC_API_KEY
├── .gitignore                    # node_modules, .env, /out
├── src/
│   ├── cli.ts                    # entry point: parses args, orchestrates the run
│   ├── personas.ts                # fixed persona definitions (name, voice, priorities)
│   ├── ocr.ts                     # wraps tesseract.js: screenshot -> extracted text
│   ├── keywordDensity.ts          # pure function: (description, ocrText[]) -> density report
│   ├── simulate.ts                # builds the persona prompt, calls Claude, parses response
│   └── report.ts                  # assembles all results into one Markdown report + ranking
├── sample-input/
│   ├── description.txt            # sample App Store description to test with
│   └── screenshots/
│       ├── screenshot-1.png        # a couple of placeholder/sample screenshots
│       └── screenshot-2.png
└── out/                            # gitignored; where generated reports land
```

Usage shape (for reference, not implementation yet):
```
tsx src/cli.ts \
  --screenshots ./sample-input/screenshots \
  --description ./sample-input/description.txt \
  --out ./out/report.md
```

## 4. Verification plan

Since this is a local CLI with one external dependency (the Claude API), verification
is split into what can be unit-tested offline and what needs a real end-to-end run:

- **Unit tests (`node:test`, no network/API calls)**:
  - `keywordDensity.ts`: given a fixed description string and fixed fake OCR text arrays,
    assert the density/overlap numbers are computed correctly (pure function, deterministic).
  - `personas.ts`: assert the fixed persona list loads and each entry has the required
    fields (name, voice/tone description, priorities) — a schema sanity check.
  - `report.ts`: given fake persona results with distinct install-intent scores, assert
    the ranking order in the assembled Markdown is correct (highest score first).

- **Manual end-to-end run-through** (the real proof this works):
  1. `cp .env.example .env` and fill in a real `ANTHROPIC_API_KEY`.
  2. `npm install`
  3. Drop 2-3 real screenshots + a real App Store description into `sample-input/`
     (Sushanth's own apps are the natural source, per the idea's stated advantage).
  4. Run: `tsx src/cli.ts --screenshots ./sample-input/screenshots --description ./sample-input/description.txt --out ./out/report.md`
  5. Open `out/report.md` and manually check:
     - each persona's critique reads as distinct in voice/priorities (not generic boilerplate)
     - the install-intent ranking is present and personas are ordered by score
     - OCR text extracted per screenshot is roughly correct (spot-check against the image)
     - keyword density section flags description keywords missing from screenshot text
  6. Re-run with a deliberately bad/generic screenshot description to confirm scores and
     critiques change meaningfully — if every run produces near-identical output regardless
     of input, the core value isn't actually being demonstrated.

No CI, no automated screenshot fixtures beyond the sample images checked into
`sample-input/` — this is a local proof-of-concept, not a shipped test suite.
