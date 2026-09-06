import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeKeywordDensity } from "./keywordDensity.js";

test("matches keywords present in OCR text and flags missing ones", () => {
  const description = "Track your workouts and build strength with custom routines.";
  const ocrTexts = ["Custom workout routines built for you", "Track progress daily"];

  const report = analyzeKeywordDensity(description, ocrTexts);

  assert.ok(report.descriptionKeywords.includes("workouts"));
  assert.ok(report.descriptionKeywords.includes("strength"));

  const matchedKeywords = report.matched.map((m) => m.keyword);
  assert.ok(matchedKeywords.includes("track"));
  assert.ok(matchedKeywords.includes("custom"));
  assert.ok(matchedKeywords.includes("routines"));

  assert.ok(report.missing.includes("strength"));
  assert.ok(report.missing.includes("build"));
});

test("coverage ratio reflects matched/total and handles empty description", () => {
  const empty = analyzeKeywordDensity("", ["some text"]);
  assert.equal(empty.coverageRatio, 0);
  assert.equal(empty.descriptionKeywords.length, 0);

  const full = analyzeKeywordDensity("focus timer", ["focus timer app"]);
  assert.equal(full.coverageRatio, 1);
});

test("counts multiple occurrences of the same keyword", () => {
  const report = analyzeKeywordDensity("focus focus focus", ["focus focus"]);
  const focusMatch = report.matched.find((m) => m.keyword === "focus");
  assert.ok(focusMatch);
  assert.equal(focusMatch?.occurrences, 2);
});
