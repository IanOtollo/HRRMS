"use client";

import type { OcrWord } from "@/lib/ocrExtraction";

export type OcrResult = {
  text: string;
  words: OcrWord[];
};

// Runs entirely in the browser via WASM (tesseract.js, Apache-2.0) — the
// scanned document image is never sent to any server for this step. Only
// the generic OCR engine + English language model (same for every user, no
// document content) load once from tesseract.js's CDN and are cached by the
// browser afterward.
export async function runOcr(image: File, onProgress: (pct: number) => void): Promise<OcrResult> {
  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("eng", undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  try {
    // Word-level confidence lives nested under blocks -> paragraphs -> lines
    // -> words in v5+ of tesseract.js — it's opt-in via the `output` param
    // (third argument) rather than returned by default.
    const { data } = await worker.recognize(image, {}, { blocks: true });

    const words: OcrWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const line of paragraph.lines ?? []) {
          for (const word of line.words ?? []) {
            words.push({ text: word.text, confidence: word.confidence });
          }
        }
      }
    }

    return { text: data.text, words };
  } finally {
    await worker.terminate();
  }
}
