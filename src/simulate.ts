import Anthropic from "@anthropic-ai/sdk";
import type { Persona } from "./personas.js";

export interface PersonaSimulationResult {
  persona: string;
  critique: string;
  rewrittenHeadline: string;
  visualVariantSuggestion: string;
  installIntentScore: number;
}

const MODEL = "claude-sonnet-4-5";

function buildPrompt(
  persona: Persona,
  description: string,
  ocrTexts: string[],
): string {
  const screenshotText = ocrTexts
    .map((text, i) => `Screenshot ${i + 1} OCR text:\n"""${text || "(no text detected)"}"""`)
    .join("\n\n");

  return `You are roleplaying as a specific App Store shopper persona: "${persona.name}".
Voice/attitude: ${persona.voice}
What this persona cares about most: ${persona.priorities.join("; ")}

You are looking at an App Store listing. Here is the app's description:
"""${description}"""

Here is the text visible in the app's screenshots (extracted via OCR, so it reflects what
Apple's screenshot text indexing would also pick up):
${screenshotText}

Respond ONLY with a JSON object (no markdown fences, no extra prose) with exactly these keys:
{
  "critique": "2-4 sentences, in this persona's voice, on their first impression and whether the listing sells them on installing",
  "rewrittenHeadline": "a single rewritten headline/caption suggestion that would land better for this persona",
  "visualVariantSuggestion": "a plain-text description of one concrete change to the screenshots (not a generated image) that would better sell this persona",
  "installIntentScore": <integer 1-10, this persona's honest likelihood of installing based on this listing as-is>
}`;
}

function parseResponse(raw: string, personaName: string): PersonaSimulationResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Could not find JSON in Claude's response for persona "${personaName}": ${raw}`,
    );
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    persona: personaName,
    critique: String(parsed.critique ?? "").trim(),
    rewrittenHeadline: String(parsed.rewrittenHeadline ?? "").trim(),
    visualVariantSuggestion: String(parsed.visualVariantSuggestion ?? "").trim(),
    installIntentScore: Number(parsed.installIntentScore ?? 0),
  };
}

export async function simulatePersona(
  client: Anthropic,
  persona: Persona,
  description: string,
  ocrTexts: string[],
): Promise<PersonaSimulationResult> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: buildPrompt(persona, description, ocrTexts) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(`No text response from Claude for persona "${persona.name}"`);
  }

  return parseResponse(textBlock.text, persona.name);
}
