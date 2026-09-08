import { randomUUID } from "node:crypto";
import type { GenerationJob, Project, Scene } from "./projectStore.js";

function characterText(project: Project) {
  if (!project.direction.characters.length) return "No named character profile provided.";
  return project.direction.characters.map((character) => `${character.name}: ${character.physicalFeatures}. Wardrobe: ${character.wardrobe}. Props: ${character.props}. Continuity: ${character.continuityNotes}.`).join("\n");
}

export function buildFlowPrompt(project: Project, scene: Scene) {
  return [
    `Create a cinematic ${project.direction.aspectRatio} video clip for Google Flow.`,
    `Maximum duration: ${Math.min(6, project.direction.maxClipSeconds)} seconds.`,
    `Visual style: ${project.direction.visualStyle}.`,
    `Scene ${scene.sceneNumber}: ${scene.narration}`,
    `Visual prompt: ${scene.visualPrompt}`,
    `Shot type: ${scene.shotType || "Choose the most suitable cinematic shot size."}`,
    `Camera angle and movement: ${scene.cameraAngle || scene.cameraPlan}.`,
    `Pacing: ${scene.pacing || project.direction.pacingRules}.`,
    `Mood and lighting: ${scene.mood}.`,
    `Sound/editing intention: ${scene.soundDesign || project.direction.audioRules}. Transition: ${scene.transition || "Invisible transition."}`,
    `Default camera language: ${project.direction.defaultCameraLanguage}. Camera rules: ${project.direction.cameraRules}`,
    `Character continuity:\n${characterText(project)}`,
    `Continuity and negative rules: ${project.direction.continuityRules} Do not exceed 6 seconds. Do not introduce modern objects. Do not change character identity. Do not reuse footage.`,
  ].join("\n\n");
}

export function queueApprovedScenes(project: Project) {
  const scenes = project.scenes || [];
  const approved = scenes.filter((scene) => scene.approvalStatus === "approved");
  if (!approved.length) throw new Error("Approve at least one scene before creating a Google Flow queue.");
  const existing = project.generationJobs || [];
  const now = new Date().toISOString();
  const newJobs: GenerationJob[] = approved.filter((scene) => !existing.some((job) => job.sceneId === scene.id)).map((scene) => ({
    id: randomUUID(),
    sceneId: scene.id,
    sceneNumber: scene.sceneNumber,
    provider: "google-flow",
    status: "queued",
    prompt: buildFlowPrompt(project, scene),
    createdAt: now,
    updatedAt: now,
  }));
  return [...existing, ...newJobs];
}
