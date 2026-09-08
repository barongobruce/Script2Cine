import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Express } from "express";

export type ProjectStage = "source-material" | "scene-analysis" | "visual-generation" | "timeline" | "render" | "complete";
export type ProjectStepStatus = "complete" | "active" | "waiting";

export type ProjectStep = {
  name: string;
  status: ProjectStepStatus;
  detail: string;
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
  return readProjects().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getProject(id: string) {
  return listProjects().find((project) => project.id === id) || null;
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
  };
  writeProjects([project, ...readProjects()]);
  return project;
}
