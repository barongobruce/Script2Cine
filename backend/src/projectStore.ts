import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Express } from "express";
import type { RenderJob } from "./renderTypes.js";

export type ProjectStage = "source-material" | "scene-analysis" | "visual-generation" | "timeline" | "render" | "complete";
export type ProjectStepStatus = "complete" | "active" | "waiting";

export type ProjectStep = {
  name: string;
  status: ProjectStepStatus;
  detail: string;
};

export type Scene = {
  id: string;
  sceneNumber: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
  narration: string;
  visualPrompt: string;
  cameraPlan: string;
  mood: string;
  shotType?: string;
  cameraAngle?: string;
  pacing?: string;
  soundDesign?: string;
  transition?: string;
  visualModel?: string;
  approvalStatus?: "draft" | "approved" | "needs-review";
};

export type CharacterProfile = {
  id: string;
  name: string;
  physicalFeatures: string;
  wardrobe: string;
  props: string;
  continuityNotes: string;
};

export type ProductionDirection = {
  visualStyle: string;
  aspectRatio: string;
  defaultCameraLanguage: string;
  colorPalette: string;
  lighting: string;
  pacingRules: string;
  audioRules: string;
  maxClipSeconds: number;
  defaultVideoModel: string;
  cameraRules: string;
  soundRules: string;
  continuityRules: string;
  characters: CharacterProfile[];
};

export type GenerationJobStatus = "queued" | "preparing" | "submitting" | "generating" | "downloading" | "complete" | "failed" | "cancelled";

export type GenerationJob = {
  id: string;
  sceneId: string;
  sceneNumber: number;
  provider: "google-flow" | "google-veo";
  status: GenerationJobStatus;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  outputUrl?: string;
  localFilePath?: string;
  error?: string;
  progress?: number;
  progressDetail?: string;
};

export type TimelineItem = {
  id: string;
  sceneId: string;
  sceneNumber: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  clipUrl: string;
  speed: number;
  transition: string;
  caption: string;
  soundEffect: string;
};

export type Project = {
  id: string;
  name: string;
  status: "in-progress" | "complete";
  stage: ProjectStage;
  progress: number;
  createdAt: string;
  updatedAt: string;
  files: {
    baseScript?: string;
    promptScript?: string;
    audio?: string;
  };
  steps: ProjectStep[];
  audioDurationSeconds?: number | null;
  scenes?: Scene[];
  direction: ProductionDirection;
  generationJobs?: GenerationJob[];
  timeline?: TimelineItem[];
  timelineApproved?: boolean;
  renderJob?: RenderJob;
};

export const defaultDirection: ProductionDirection = {
  visualStyle: "Epic biblical cinema",
  aspectRatio: "16:9",
  defaultCameraLanguage: "Slow controlled movement, grounded compositions",
  colorPalette: "Warm earth tones, amber highlights, deep shadows",
  lighting: "Naturalistic golden-hour light unless the scene specifies otherwise",
  pacingRules: "One visual beat per sentence. Let emotional moments breathe. Never cut through a meaningful phrase.",
  audioRules: "Match visuals to narration. Use silence before major reveals and impact sounds only on important moments.",
  maxClipSeconds: 6,
  defaultVideoModel: "Cinematic realism",
  cameraRules: "Use tagged camera instructions when they fit the scene. Prefer motivated dolly, arc, tracking, reveal, focus, and crane moves.",
  soundRules: "Add restrained sound effects for new characters and major events. Use invisible transitions whenever possible.",
  continuityRules: "Maintain physical features, wardrobe, props, lighting, and location continuity. Never reuse the same footage.",
  characters: [],
};

const dataDirectory = path.resolve(process.env.PROJECT_DATA_DIR || "./data");
const uploadDirectory = path.join(dataDirectory, "uploads");
const projectsFile = path.join(dataDirectory, "projects.json");

fs.mkdirSync(uploadDirectory, { recursive: true });

function readProjects(): Project[] {
  if (!fs.existsSync(projectsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(projectsFile, "utf8")) as Project[];
  } catch {
    return [];
  }
}

function writeProjects(projects: Project[]) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

function withDefaults(project: Project): Project {
  return { ...project, direction: { ...defaultDirection, ...(project.direction || {}), characters: project.direction?.characters || [] } };
}

function buildSteps(files: Project["files"]): ProjectStep[] {
  const sourcesReady = Boolean(files.baseScript && files.promptScript && files.audio);
  return [
    { name: "Source material", status: sourcesReady ? "complete" : "active", detail: sourcesReady ? "3 / 3 sources uploaded" : "Waiting for all 3 sources" },
    { name: "Scene analysis", status: sourcesReady ? "active" : "waiting", detail: sourcesReady ? "Ready to analyze" : "Waiting for source material" },
    { name: "Visual generation", status: "waiting", detail: "Waiting" },
    { name: "Timeline", status: "waiting", detail: "Waiting" },
    { name: "Render", status: "waiting", detail: "Waiting" },
  ];
}

export function listProjects() {
  return readProjects().map(withDefaults).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getProject(id: string) {
  return listProjects().find((project) => project.id === id) || null;
}

export function getUploadPath(fileName: string) {
  return path.join(uploadDirectory, path.basename(fileName));
}

export function updateProject(id: string, patch: Partial<Project>) {
  const projects = readProjects();
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return null;
  projects[index] = { ...projects[index], ...patch, updatedAt: new Date().toISOString() };
  writeProjects(projects);
  return projects[index];
}

export function updateDirection(id: string, direction: ProductionDirection) {
  return updateProject(id, { direction });
}

export function createProject(name: string, files: Record<string, Express.Multer.File | undefined>): Project {
  const now = new Date().toISOString();
  const storedFiles = {
    baseScript: files.baseScript?.filename,
    promptScript: files.promptScript?.filename,
    audio: files.audio?.filename,
  };
  const project: Project = {
    id: randomUUID(),
    name: name.trim() || "Untitled production",
    status: "in-progress",
    stage: "scene-analysis",
    progress: 30,
    createdAt: now,
    updatedAt: now,
    files: storedFiles,
    steps: buildSteps(storedFiles),
    direction: { ...defaultDirection, characters: [] },
  };
  writeProjects([project, ...readProjects()]);
  return project;
}
