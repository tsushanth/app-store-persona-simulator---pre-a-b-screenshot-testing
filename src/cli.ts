import { Command } from "commander";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { PERSONAS } from "./personas.js";
import { ocrScreenshots } from "./ocr.js";
import { analyzeKeywordDensity } from "./keywordDensity.js";
import { simulatePersona } from "./simulate.js";
import { buildReport } from "./report.js";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function listScreenshotFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(dir, e.name))
    .sort();
}

async function main() {
  const program = new Command();
  program
    .requiredOption("--screenshots <dir>", "directory of screenshot images")
    .requiredOption("--description <file>", "path to a text file with the App Store description")
    .requiredOption("--out <file>", "path to write the generated Markdown report");

  program.parse(process.argv);
  const opts = program.opts<{ screenshots: string; description: string; out: string }>();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing ANTHROPIC_API_KEY. Copy .env.example to .env, fill it in, and export it, e.g.:\n" +
        "  export $(cat .env | xargs)",
    );
    process.exit(1);
  }

  const description = await readFile(opts.description, "utf-8");
  const screenshotFiles = await listScreenshotFiles(opts.screenshots);
  if (screenshotFiles.length === 0) {
    console.error(`No screenshot images found in ${opts.screenshots}`);
    process.exit(1);
  }

  console.log(`Found ${screenshotFiles.length} screenshot(s). Running OCR...`);
  const ocrResults = await ocrScreenshots(screenshotFiles);

  console.log("Checking keyword density against description...");
  const keywordReport = analyzeKeywordDensity(
    description,
    ocrResults.map((r) => r.text),
  );

  console.log(`Simulating ${PERSONAS.length} personas via Claude...`);
  const client = new Anthropic({ apiKey });
  const personaResults = await Promise.all(
    PERSONAS.map((persona) =>
      simulatePersona(
        client,
        persona,
        description,
        ocrResults.map((r) => r.text),
      ),
    ),
  );

  const report = buildReport(description, ocrResults, keywordReport, personaResults);

  await mkdir(path.dirname(opts.out), { recursive: true });
  await writeFile(opts.out, report, "utf-8");
  console.log(`Report written to ${opts.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
