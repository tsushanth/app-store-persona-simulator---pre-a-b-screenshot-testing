import type { PersonaSimulationResult } from "./simulate.js";
import type { ScreenshotOcrResult } from "./ocr.js";
import type { KeywordDensityReport } from "./keywordDensity.js";

export function rankByInstallIntent(
  results: PersonaSimulationResult[],
): PersonaSimulationResult[] {
  return [...results].sort((a, b) => b.installIntentScore - a.installIntentScore);
}

export function buildReport(
  description: string,
  ocrResults: ScreenshotOcrResult[],
  keywordReport: KeywordDensityReport,
  personaResults: PersonaSimulationResult[],
): string {
  const ranked = rankByInstallIntent(personaResults);
  const lines: string[] = [];

  lines.push("# App Store Persona Simulation Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("## Input description");
  lines.push("");
  lines.push("```");
  lines.push(description.trim());
  lines.push("```");
  lines.push("");

  lines.push("## Persona ranking (highest predicted install intent first)");
  lines.push("");
  ranked.forEach((r, i) => {
    lines.push(`${i + 1}. **${r.persona}** — install intent: ${r.installIntentScore}/10`);
  });
  lines.push("");

  lines.push("## Persona critiques");
  lines.push("");
  for (const r of ranked) {
    lines.push(`### ${r.persona} (install intent: ${r.installIntentScore}/10)`);
    lines.push("");
    lines.push(`**First-impression critique:** ${r.critique}`);
    lines.push("");
    lines.push(`**Rewritten headline suggestion:** ${r.rewrittenHeadline}`);
    lines.push("");
    lines.push(`**Visual variant suggestion:** ${r.visualVariantSuggestion}`);
    lines.push("");
  }

  lines.push("## Screenshot OCR text");
  lines.push("");
  ocrResults.forEach((o, i) => {
    lines.push(`**Screenshot ${i + 1}** (\`${o.file}\`):`);
    lines.push("```");
    lines.push(o.text || "(no text detected)");
    lines.push("```");
    lines.push("");
  });

  lines.push("## Keyword density check");
  lines.push("");
  lines.push(
    `Coverage: ${keywordReport.matched.length}/${keywordReport.descriptionKeywords.length} ` +
      `description keywords appear in screenshot text (${Math.round(
        keywordReport.coverageRatio * 100,
      )}%).`,
  );
  lines.push("");
  if (keywordReport.matched.length > 0) {
    lines.push("**Matched keywords:**");
    keywordReport.matched.forEach((m) => {
      lines.push(`- ${m.keyword} (${m.occurrences}x)`);
    });
    lines.push("");
  }
  if (keywordReport.missing.length > 0) {
    lines.push(
      "**Missing from screenshot text** (candidates to add — Apple now OCR-indexes screenshot text):",
    );
    keywordReport.missing.forEach((k) => {
      lines.push(`- ${k}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}
