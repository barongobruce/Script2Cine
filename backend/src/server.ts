import "dotenv/config";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";
import { ZodError } from "zod";
import { parseScript } from "./parser.js";
import { extractAudioDuration, extractText } from "./fileExtractor.js";
import { analyzeScenes } from "./sceneAnalyzer.js";
import { createProject, getProject, getUploadPath, listProjects, updateDirection, updateProject, type ProductionDirection } from "./projectStore.js";
import { queueApprovedScenes } from "./generationQueue.js";
import { parseRequestSchema } from "./types.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

const uploadDirectory = path.resolve(process.env.PROJECT_DATA_DIR || "./data", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, uploadDirectory),
    filename: (_request, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

app.get("/", (_request, response) => {
  response.json({
    service: "script2cine-parser",
    ok: true,
    message: "Backend is running. Use /health or the frontend at http://localhost:5173.",
  });
});

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "script2cine-parser" });
});

app.get("/api/projects", (_request, response) => {
  response.json({ projects: listProjects() });
});

app.get("/api/projects/:id", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) {
    response.status(404).json({ error: "Project not found" });
    return;
  }
  response.json({ project });
});

app.patch("/api/projects/:id/direction", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) {
    response.status(404).json({ error: "Project not found" });
    return;
  }
  const direction = request.body as ProductionDirection;
  if (!direction || typeof direction.visualStyle !== "string" || !Number.isFinite(Number(direction.maxClipSeconds))) {
    response.status(400).json({ error: "A valid production direction is required." });
    return;
  }
  const updatedProject = updateDirection(project.id, {
    ...project.direction,
    ...direction,
    maxClipSeconds: Math.min(6, Math.max(1, Number(direction.maxClipSeconds))),
    characters: Array.isArray(direction.characters) ? direction.characters : project.direction.characters,
  });
  if (updatedProject) {
    const scenes = updatedProject.scenes?.map((scene) => ({ ...scene, visualModel: scene.visualModel || updatedProject.direction.defaultVideoModel }));
    updateProject(updatedProject.id, { scenes, stage: "visual-generation", progress: Math.max(updatedProject.progress, 50), steps: updatedProject.steps.map((step) => step.name === "Visual generation" ? { ...step, status: "active", detail: "Production direction saved" } : step) });
  }
  response.json({ project: getProject(project.id) });
});

app.post("/api/projects/:id/analyze", async (request, response) => {
  try {
    const project = getProject(request.params.id);
    if (!project) {
      response.status(404).json({ error: "Project not found" });
      return;
    }
    if (!project.files.baseScript || !project.files.promptScript || !project.files.audio) {
      response.status(400).json({ error: "This project is missing one or more source files." });
      return;
    }

    const [scriptText, promptText, audioDurationSeconds] = await Promise.all([
      extractText(getUploadPath(project.files.baseScript), project.files.baseScript),
      extractText(getUploadPath(project.files.promptScript), project.files.promptScript),
      extractAudioDuration(getUploadPath(project.files.audio)),
    ]);
    const scenes = analyzeScenes(scriptText, promptText, audioDurationSeconds).map((scene) => ({ ...scene, visualModel: project.direction.defaultVideoModel, approvalStatus: "draft" as const }));
    const updatedProject = updateProject(project.id, {
      stage: "visual-generation",
      progress: 45,
      audioDurationSeconds,
      scenes,
      steps: [
        { name: "Source material", status: "complete", detail: "3 / 3 sources uploaded" },
        { name: "Scene analysis", status: "complete", detail: `${scenes.length} scenes identified` },
        { name: "Visual generation", status: "active", detail: "Ready to generate scenes" },
        { name: "Timeline", status: "waiting", detail: "Waiting" },
        { name: "Render", status: "waiting", detail: "Waiting" },
      ],
    });
    response.json({ project: updatedProject });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: error instanceof Error ? error.message : "Scene analysis failed" });
  }
});

app.patch("/api/projects/:id/scenes", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) {
    response.status(404).json({ error: "Project not found" });
    return;
  }
  if (!Array.isArray(request.body?.scenes)) {
    response.status(400).json({ error: "scenes must be an array" });
    return;
  }
  const updatedProject = updateProject(project.id, { scenes: request.body.scenes });
  response.json({ project: updatedProject });
});

app.post("/api/projects/:id/generation-queue", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) {
    response.status(404).json({ error: "Project not found" });
    return;
  }
  try {
    const generationJobs = queueApprovedScenes(project);
    const queuedProject = updateProject(project.id, {
      generationJobs,
      stage: "visual-generation",
      progress: Math.max(project.progress, 60),
      steps: project.steps.map((step) => step.name === "Visual generation" ? { ...step, status: "active", detail: `${generationJobs.length} Google Flow jobs queued` } : step),
    });
    response.status(201).json({ project: queuedProject, jobs: generationJobs });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Could not create generation queue" });
  }
});

app.patch("/api/projects/:id/generation-jobs/:jobId", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) {
    response.status(404).json({ error: "Project not found" });
    return;
  }
  const jobs = project.generationJobs || [];
  const job = jobs.find((item) => item.id === request.params.jobId);
  if (!job) {
    response.status(404).json({ error: "Generation job not found" });
    return;
  }
  const allowed = ["queued", "preparing", "generating", "complete", "failed"];
  if (!allowed.includes(request.body?.status)) {
    response.status(400).json({ error: "Invalid generation status" });
    return;
  }
  const updatedJobs = jobs.map((item) => item.id === job.id ? { ...item, status: request.body.status, outputUrl: request.body.outputUrl || item.outputUrl, error: request.body.error, updatedAt: new Date().toISOString() } : item);
  const completed = updatedJobs.filter((item) => item.status === "complete").length;
  const failed = updatedJobs.filter((item) => item.status === "failed").length;
  const allFinished = updatedJobs.length > 0 && completed + failed === updatedJobs.length;
  const updatedProject = updateProject(project.id, {
    generationJobs: updatedJobs,
    stage: allFinished && failed === 0 ? "timeline" : "visual-generation",
    progress: allFinished && failed === 0 ? 75 : Math.max(project.progress, 60),
    steps: project.steps.map((step) => {
      if (step.name !== "Visual generation") return step;
      if (allFinished && failed === 0) return { ...step, status: "complete", detail: `${completed} / ${updatedJobs.length} clips complete` };
      return { ...step, status: "active", detail: `${completed} / ${updatedJobs.length} clips complete${failed ? ` · ${failed} failed` : ""}` };
    }),
  });
  response.json({ project: updatedProject });
});

app.post("/api/projects/:id/timeline/prepare", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) { response.status(404).json({ error: "Project not found" }); return; }
  const scenes = project.scenes || [];
  const jobs = project.generationJobs || [];
  const missing = scenes.filter((scene) => scene.approvalStatus === "approved" && !jobs.some((job) => job.sceneId === scene.id && job.status === "complete" && job.outputUrl));
  if (missing.length) { response.status(400).json({ error: `${missing.length} approved scene${missing.length === 1 ? " is" : "s are"} missing a completed Google Flow clip.` }); return; }
  const timeline = scenes.filter((scene) => scene.approvalStatus === "approved").map((scene) => {
    const job = jobs.find((item) => item.sceneId === scene.id && item.status === "complete" && item.outputUrl);
    return { id: randomUUID(), sceneId: scene.id, sceneNumber: scene.sceneNumber, startTimeSeconds: scene.startTimeSeconds, endTimeSeconds: scene.endTimeSeconds, clipUrl: job?.outputUrl || "", speed: 1, transition: scene.transition || "Invisible transition", caption: "", soundEffect: scene.soundDesign || "" };
  });
  const updatedProject = updateProject(project.id, { timeline, timelineApproved: false, stage: "timeline", progress: Math.max(project.progress, 80), steps: project.steps.map((step) => step.name === "Timeline" ? { ...step, status: "active", detail: `${timeline.length} clips placed on timeline` } : step) });
  response.status(201).json({ project: updatedProject });
});

app.patch("/api/projects/:id/timeline", (request, response) => {
  const project = getProject(request.params.id);
  if (!project) { response.status(404).json({ error: "Project not found" }); return; }
  if (!Array.isArray(request.body?.timeline)) { response.status(400).json({ error: "timeline must be an array" }); return; }
  const approved = Boolean(request.body.timelineApproved);
  const updatedProject = updateProject(project.id, { timeline: request.body.timeline, timelineApproved: approved, stage: approved ? "render" : "timeline", progress: approved ? Math.max(project.progress, 90) : Math.max(project.progress, 80), steps: project.steps.map((step) => {
    if (step.name === "Timeline") return { ...step, status: approved ? "complete" : "active", detail: approved ? "Timeline approved for render" : `${request.body.timeline.length} clips placed on timeline` };
    if (step.name === "Render" && approved) return { ...step, status: "active", detail: "Ready for final render" };
    return step;
  }) });
  response.json({ project: updatedProject });
});

app.post(
  "/api/projects",
  upload.fields([
    { name: "baseScript", maxCount: 1 },
    { name: "promptScript", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  (request, response) => {
    const files = request.files as Record<string, Express.Multer.File[]> | undefined;
    const selectedFiles = {
      baseScript: files?.baseScript?.[0],
      promptScript: files?.promptScript?.[0],
      audio: files?.audio?.[0],
    };
    if (!selectedFiles.baseScript || !selectedFiles.promptScript || !selectedFiles.audio) {
      response.status(400).json({ error: "Base script, prompt script, and audio are all required." });
      return;
    }
    const project = createProject(String(request.body.projectName || "Untitled production"), selectedFiles);
    response.status(201).json({ project });
  },
);

app.post("/api/parser/parse", async (request, response) => {
  try {
    const input = parseRequestSchema.parse(request.body);
    const plan = await parseScript(input);
    response.json(plan);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "Invalid parser request", details: error.flatten() });
      return;
    }

    console.error(error);
    response.status(500).json({ error: error instanceof Error ? error.message : "Parser failed" });
  }
});

app.listen(port, () => {
  console.log(`Script2Cine parser listening on http://localhost:${port}`);
});
