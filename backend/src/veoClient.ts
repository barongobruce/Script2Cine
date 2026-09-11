import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import type { Project, Scene } from "./projectStore.js";
import { buildFlowPrompt } from "./generationQueue.js";

const model = process.env.VEO_MODEL || "veo-3.1-generate-preview";
const videoDirectory = path.resolve(process.env.PROJECT_DATA_DIR || "./data", "videos");
const controllers = new Map<string, AbortController>();

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in backend/.env");
  return new GoogleGenAI({ apiKey });
}

export function cancelGeneration(jobId: string) {
  const controller = controllers.get(jobId);
  if (!controller) return false;
  controller.abort();
  return true;
}

export async function generateAndDownloadScene(project: Project, scene: Scene, jobId: string, onProgress: (status: "submitting" | "generating" | "downloading", progress: number, detail: string) => void) {
  const ai = client();
  const controller = new AbortController();
  controllers.set(jobId, controller);
  try {
    await fs.mkdir(videoDirectory, { recursive: true });
    onProgress("submitting", 5, "Submitting scene prompt to Veo");
    const operation = await ai.models.generateVideos({
      model,
      prompt: buildFlowPrompt(project, scene).replace("Google Flow", "Veo"),
      config: {
        numberOfVideos: 1,
        durationSeconds: Math.min(8, Math.max(1, Math.min(6, project.direction.maxClipSeconds))),
        aspectRatio: project.direction.aspectRatio === "9:16" ? "9:16" : "16:9",
        resolution: process.env.VEO_RESOLUTION || "720p",
        abortSignal: controller.signal,
      },
    });
    onProgress("generating", 10, "Veo is generating the scene");
    let current = operation;
    let checks = 0;
    while (!current.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      if (controller.signal.aborted) throw new Error("Generation cancelled");
      current = await ai.operations.getVideosOperation({ operation: current });
      checks += 1;
      onProgress("generating", Math.min(85, 10 + checks * 5), "Waiting for Veo to finish");
    }
    const video = current.response?.generatedVideos?.[0]?.video;
    if (!video) throw new Error("Veo completed without returning a video file.");
    onProgress("downloading", 90, "Downloading generated MP4");
    const fileName = `${project.id}-${scene.sceneNumber.toString().padStart(3, "0")}-${jobId}.mp4`;
    const absolutePath = path.join(videoDirectory, fileName);
    await ai.files.download({ file: video, downloadPath: absolutePath });
    onProgress("downloading", 100, "MP4 downloaded and stored locally");
    return { absolutePath, publicPath: `/videos/${fileName}` };
  } finally {
    controllers.delete(jobId);
  }
}
