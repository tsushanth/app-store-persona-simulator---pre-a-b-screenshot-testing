import { test } from "node:test";
import assert from "node:assert/strict";
import { rankByInstallIntent, buildReport } from "./report.js";
import type { PersonaSimulationResult } from "./simulate.js";

function fakeResult(persona: string, score: number): PersonaSimulationResult {
  return {
    persona,
    critique: `${persona} critique`,
    rewrittenHeadline: `${persona} headline`,
    visualVariantSuggestion: `${persona} variant`,
    installIntentScore: score,
  };
}

test("rankByInstallIntent orders highest score first", () => {
  const results = [fakeResult("A", 3), fakeResult("B", 9), fakeResult("C", 6)];
  const ranked = rankByInstallIntent(results);
  assert.deepEqual(
    ranked.map((r) => r.persona),
    ["B", "C", "A"],
  );
});

test("buildReport lists personas in ranked order in the ranking section", () => {
  const results = [fakeResult("Low", 2), fakeResult("High", 8), fakeResult("Mid", 5)];
  const report = buildReport(
    "A sample description",
    [{ file: "shot1.png", text: "some text" }],
    { descriptionKeywords: ["sample"], matched: [], missing: ["sample"], coverageRatio: 0 },
    results,
  );

  const rankingSectionStart = report.indexOf("## Persona ranking");
  const critiquesSectionStart = report.indexOf("## Persona critiques");
  const rankingSection = report.slice(rankingSectionStart, critiquesSectionStart);

  const highIndex = rankingSection.indexOf("High");
  const midIndex = rankingSection.indexOf("Mid");
  const lowIndex = rankingSection.indexOf("Low");

  assert.ok(highIndex < midIndex);
  assert.ok(midIndex < lowIndex);
});
