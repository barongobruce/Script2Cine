import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { parseFile } from "music-metadata";

function extension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

export async function extractText(filePath: string, fileName: string) {
  const buffer = await fs.readFile(filePath);
  const ext = extension(fileName);

  if ([".txt", ".md", ".json"].includes(ext)) return buffer.toString("utf8");

  if ([".doc", ".docx"].includes(ext)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === ".pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(`Unsupported text file type: ${ext || "unknown"}`);
}

export async function extractAudioDuration(filePath: string) {
  const metadata = await parseFile(filePath, { duration: true });
  return metadata.format.duration || null;
}
