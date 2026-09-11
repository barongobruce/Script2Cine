import type { Project } from "./projectStore.js";

export type RenderStatus =
  | "queued"
  | "preparing"
  | "complete"
  | "failed";

export type RenderSettings = {
  aspectRatio: string;
  width: number;
  height: number;
  frameRate: number;
  format: "mp4";
  includeCaptions: boolean;
};

export type RenderJob = {
  id: string;
  status: RenderStatus;
  settings: RenderSettings;
  manifestPath?: string;
  outputUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export function validateRender(project: Project) {
  const errors: string[] = [];

  if (!project.timelineApproved) {
    errors.push("Approve the timeline before rendering.");
  }

  if (!project.timeline?.length) {
    errors.push("Prepare the timeline before rendering.");
  }

  if (project.timeline?.some((item) => !item.clipUrl)) {
    errors.push("Every timeline item needs a completed clip URL.");
  }

  if (!project.files.audio) {
    errors.push("The master audio file is missing.");
  }

  if (
    project.timeline?.some(
      (item) => item.endTimeSeconds <= item.startTimeSeconds,
    )
  ) {
    errors.push("Every timeline item must have valid timing.");
  }

  return errors;
}

