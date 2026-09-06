import type { ProductionPlan, ProductionShot, RawShot } from "./types.js";

export function normalizeShots(rawShots: RawShot[], targetDurationSeconds: number, clipDurationSeconds: number): ProductionShot[] {
  const shots: ProductionShot[] = [];
  let cursor = 0;

  for (const [index, raw] of rawShots.entries()) {
    if (cursor >= targetDurationSeconds) break;

    const requested = Number(raw.requestedDurationSeconds) || clipDurationSeconds;
    const duration = Math.min(Math.max(requested, 0.1), targetDurationSeconds - cursor);
    if (duration <= 0) continue;

    shots.push({
      shotNumber: index + 1,
      sceneNumber: Math.max(1, Math.trunc(Number(raw.sceneNumber) || index + 1)),
      startTimeSeconds: cursor,
      endTimeSeconds: cursor + duration,
      durationSeconds: duration,
      voiceover: raw.voiceover?.trim() ?? "",
      characters: raw.characters ?? [],
      visualPrompt: raw.visualPrompt?.trim() ?? "",
      cameraPlan: raw.cameraPlan?.trim() ?? "",
      motionPlan: raw.motionPlan?.trim() ?? "",
      soundPlan: raw.soundPlan?.trim() ?? "",
      lighting: raw.lighting?.trim() ?? "",
      transition: raw.transition?.trim() || "hard cut",
      speedTreatment: raw.speedTreatment?.trim() || (duration < clipDurationSeconds ? "final partial clip" : "normal speed"),
      continuity: raw.continuity ?? [],
    });

    cursor += duration;
  }

  while (cursor < targetDurationSeconds) {
    const duration = Math.min(clipDurationSeconds, targetDurationSeconds - cursor);
    const previous = shots.at(-1);

    shots.push({
      shotNumber: shots.length + 1,
      sceneNumber: previous?.sceneNumber ?? shots.length + 1,
      startTimeSeconds: cursor,
      endTimeSeconds: cursor + duration,
      durationSeconds: duration,
      voiceover: previous?.voiceover ?? "",
      characters: previous?.characters ?? [],
      visualPrompt: previous?.visualPrompt || "Atmospheric continuation shot preserving the previous scene's continuity.",
      cameraPlan: previous?.cameraPlan || "Locked-off hold with subtle environmental motion.",
      motionPlan: previous?.motionPlan || "Subtle wind, dust, fabric, smoke, or water movement only.",
      soundPlan: previous?.soundPlan || "Continue the established sound bed.",
      lighting: previous?.lighting || "Preserve the established lighting.",
      transition: "hold",
      speedTreatment: duration < clipDurationSeconds ? "final partial clip" : "continuation hold",
      continuity: previous?.continuity ?? [],
    });

    cursor += duration;
  }

  return shots;
}

export function validateProductionPlan(plan: ProductionPlan) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const epsilon = 0.001;
  const total = plan.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);

  if (plan.shots.length === 0) errors.push("No shots were generated.");
  if (Math.abs(total - plan.targetDurationSeconds) > epsilon) {
    errors.push(`Timeline totals ${total}s, expected ${plan.targetDurationSeconds}s.`);
  }

  plan.shots.forEach((shot, index) => {
    if (!shot.visualPrompt) errors.push(`Shot ${shot.shotNumber} is missing a visual prompt.`);
    if (!shot.cameraPlan) warnings.push(`Shot ${shot.shotNumber} is missing a camera plan.`);
    if (index > 0) {
      const previous = plan.shots[index - 1];
      if (Math.abs(shot.startTimeSeconds - previous.endTimeSeconds) > epsilon) {
        errors.push(`Gap or overlap before shot ${shot.shotNumber}.`);
      }
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

