const STOPWORDS = new Set([
  "the", "and", "for", "with", "your", "you", "our", "are", "that", "this",
  "from", "have", "has", "will", "can", "all", "not", "but", "was", "were",
  "into", "more", "get", "app", "its", "it's", "a", "an", "of", "to", "in",
  "on", "is", "be", "as", "at", "or", "we", "us", "so",
]);

export interface KeywordDensityReport {
  descriptionKeywords: string[];
  matched: { keyword: string; occurrences: number }[];
  missing: string[];
  coverageRatio: number;
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return Array.from(new Set(words));
}

export function analyzeKeywordDensity(
  description: string,
  ocrTexts: string[],
): KeywordDensityReport {
  const descriptionKeywords = extractKeywords(description);
  const combinedOcrText = ocrTexts.join(" ").toLowerCase();

  const matched: { keyword: string; occurrences: number }[] = [];
  const missing: string[] = [];

  for (const keyword of descriptionKeywords) {
    const occurrences = (
      combinedOcrText.match(new RegExp(`\\b${keyword}\\b`, "g")) ?? []
    ).length;
    if (occurrences > 0) {
      matched.push({ keyword, occurrences });
    } else {
      missing.push(keyword);
    }
  }

  const coverageRatio =
    descriptionKeywords.length === 0
      ? 0
      : matched.length / descriptionKeywords.length;

  return { descriptionKeywords, matched, missing, coverageRatio };
}
