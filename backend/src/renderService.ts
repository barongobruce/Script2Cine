import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Project } from "./projectStore.js";
import {
  validateRender,
  type RenderJob,
  type RenderSettings,
} from "./renderTypes.js";

const execFileAsync = promisify(execFile);

const dataDirectory = path.resolve(
  process.env.PROJECT_DATA_DIR || "./data",
);

const renderDirectory = path.join(dataDirectory, "renders");
const uploadDirectory = path.join(dataDirectory, "uploads");

fs.mkdirSync(renderDirectory, { recursive: true });

function localVideoFor(project: Project, sceneId: string) {
  const job = project.generationJobs?.find(
    (item) =>
      item.sceneId === sceneId &&
      item.status === "complete",
  );

  return job?.localFilePath || null;
}

export async function renderProject(
  project: Project,
  settings: RenderSettings,
): Promise<RenderJob> {
  const errors = validateRender(project);
  const timeline = project.timeline || [];

  const missingFiles = timeline.filter((item) => {
    const videoPath = localVideoFor(project, item.sceneId);

    return !videoPath || !fs.existsSync(videoPath);
  });

  if (missingFiles.length > 0) {
    errors.push(
      `${missingFiles.length} timeline clip${
        missingFiles.length === 1 ? " is" : "s are"
      } not downloaded locally yet.`,
    );
  }

  if (!project.files.audio) {
    errors.push("The master audio file is missing.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const audioPath = path.join(
    uploadDirectory,
    path.basename(project.files.audio as string),
  );

  if (!fs.existsSync(audioPath)) {
    throw new Error(
      "The master audio file cannot be found in backend/data/uploads.",
    );
  }

  if (timeline.length === 0) {
    throw new Error("The timeline has no scenes to render.");
  }

  const id = randomUUID();
  const fileName = `${project.id}-${id}.mp4`;
  const outputPath = path.join(renderDirectory, fileName);

  const inputVideoPaths = timeline.map((item) => {
    const videoPath = localVideoFor(project, item.sceneId);

    if (!videoPath) {
      throw new Error(
        `No downloaded video was found for scene ${item.sceneNumber}.`,
      );
    }

    return videoPath;
  });

  const videoInputs = inputVideoPaths.flatMap((videoPath) => [
    "-i",
    videoPath,
  ]);

  const videoFilters = timeline
    .map((item, index) => {
      const duration = Math.max(
        0.1,
        item.endTimeSeconds - item.startTimeSeconds,
      );

      return [
        `[${index}:v]`,
        `scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,`,
        `pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2,`,
        `fps=${settings.frameRate},`,
        `trim=duration=${duration},`,
        "setpts=PTS-STARTPTS",
        `[v${index}]`,
      ].join("");
    })
    .join(";");

  const concatInputs = timeline
    .map((_item, index) => `[v${index}]`)
    .join("");

  const totalDuration = Math.max(
    ...timeline.map((item) => item.endTimeSeconds),
  );

  const filterComplex = [
    videoFilters,
    `${concatInputs}concat=n=${timeline.length}:v=1:a=0[vout]`,
  ].join(";");

  const ffmpegArguments = [
    ...videoInputs,

    "-i",
    audioPath,

    "-filter_complex",
    filterComplex,

    "-map",
    "[vout]",

    "-map",
    `${inputVideoPaths.length}:a:0`,

    "-t",
    String(totalDuration),

    "-r",
    String(settings.frameRate),

    "-c:v",
    "libx264",

    "-preset",
    "veryfast",

    "-pix_fmt",
    "yuv420p",

    "-c:a",
    "aac",

    "-b:a",
    "192k",

    "-movflags",
    "+faststart",

    "-y",
    outputPath,
  ];

  await execFileAsync("ffmpeg", ffmpegArguments, {
    maxBuffer: 10 * 1024 * 1024,
  });

  const now = new Date().toISOString();

  return {
    id,
    status: "complete",
    settings,
    manifestPath: fileName,
    outputUrl: `/renders/${fileName}`,
    createdAt: now,
    updatedAt: now,
  };
}
