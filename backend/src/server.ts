import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";
import { ZodError } from "zod";
import { parseScript } from "./parser.js";
import { createProject, getProject, listProjects } from "./projectStore.js";
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

