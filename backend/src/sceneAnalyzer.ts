import { randomUUID } from "node:crypto";
import type { Scene } from "./projectStore.js";

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractField(block: string, labels: string[]) {
  const label = labels.join("|");
  const match = block.match(new RegExp(`(?:${label})\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*[A-Za-z +]+\\s*:|$)`, "i"));
  return clean(match?.[1] || "");
}

function splitBlocks(text: string) {
  const matches = [...text.matchAll(/(?:^|\n)\s*(?:SCENE|SHOT)\s*(\d+)\s*:?/gi)];
  if (!matches.length) {
    return text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean).map((block, index) => ({ number: index + 1, block }));
  }
  return matches.map((match, index) => ({
    number: Number(match[1]) || index + 1,
    block: text.slice(match.index! + match[0].length, matches[index + 1]?.index ?? text.length).trim(),
  }));
}

export function analyzeScenes(scriptText: string, promptText: string, audioDurationSeconds: number | null): Scene[] {
  const scriptBlocks = splitBlocks(scriptText);
  const promptBlocks = splitBlocks(promptText);
  const duration = audioDurationSeconds && audioDurationSeconds > 0 ? audioDurationSeconds / scriptBlocks.length : 6;
  let cursor = 0;

  return scriptBlocks.map((entry, index) => {
    const promptBlock = promptBlocks[index]?.block || "";
    const narration = extractField(entry.block, ["Narration", "Voiceover"]) || clean(entry.block.split(/\n/)[0] || entry.block);
    const visualPrompt = extractField(promptBlock, ["Visual Prompt", "Visual", "Prompt"]) || extractField(entry.block, ["Visual Prompt", "Visual", "Prompt"]) || clean(promptBlock || entry.block);
    const cameraPlan = extractField(promptBlock, ["Camera", "Camera Plan"]) || extractField(entry.block, ["Camera", "Camera Plan"]) || "Cinematic coverage preserving continuity.";
    const mood = extractField(promptBlock, ["Mood", "Lighting", "Style"]) || extractField(entry.block, ["Mood", "Lighting", "Style"]) || "Cinematic and coherent.";
    const scene = {
      id: randomUUID(),
      sceneNumber: entry.number || index + 1,
      startTimeSeconds: Number(cursor.toFixed(3)),
      endTimeSeconds: Number((cursor + duration).toFixed(3)),
      durationSeconds: Number(duration.toFixed(3)),
      narration,
      visualPrompt,
      cameraPlan,
      mood,
    };
    cursor += duration;
    return scene;
  });
}
