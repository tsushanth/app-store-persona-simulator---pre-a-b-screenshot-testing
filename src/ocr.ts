import { createWorker } from "tesseract.js";

export interface ScreenshotOcrResult {
  file: string;
  text: string;
}

export async function ocrScreenshots(
  filePaths: string[],
): Promise<ScreenshotOcrResult[]> {
  const worker = await createWorker("eng");
  try {
    const results: ScreenshotOcrResult[] = [];
    for (const file of filePaths) {
      const {
        data: { text },
      } = await worker.recognize(file);
      results.push({ file, text: text.trim() });
    }
    return results;
  } finally {
    await worker.terminate();
  }
}
