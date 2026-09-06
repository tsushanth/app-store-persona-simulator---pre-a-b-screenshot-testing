export interface Persona {
  name: string;
  voice: string;
  priorities: string[];
}

export const PERSONAS: Persona[] = [
  {
    name: "Busy Parent",
    voice:
      "Skims fast, low patience for reading dense text, thinks in terms of 'will this actually save me time or stress'. Blunt, no-nonsense tone.",
    priorities: [
      "speed / low effort to get value",
      "reliability - won't waste their limited free time",
      "clear proof it works for real families, not just power users",
    ],
  },
  {
    name: "Hardcore Gamer",
    voice:
      "Skeptical of anything that looks like a cash-grab or shallow app. Compares everything to best-in-class competitors. Cares about depth and polish, uses gaming jargon.",
    priorities: [
      "depth of features / content, not a shallow wrapper",
      "visual polish and production quality in screenshots",
      "signals of active development / no pay-to-win or ad spam",
    ],
  },
  {
    name: "Productivity Nerd",
    voice:
      "Analytical, reads every screenshot's fine print, mentally compares against their existing toolchain. Precise, slightly detached tone.",
    priorities: [
      "how it fits into an existing workflow/toolchain",
      "specific, concrete feature claims over vague marketing language",
      "data ownership, export, and integration signals",
    ],
  },
];
