import { z } from "zod";

export const parserExampleSchema = z.object({
  voiceover: z.string(),
  visualPrompt: z.string(),
  cameraPlan: z.string().optional(),
  soundPlan: z.string().optional(),
});

export const parseRequestSchema = z.object({
  scriptText: z.string().min(1).max(200_000),
  targetDurationSeconds: z.number().int().min(1).max(86_400),
  clipDurationSeconds: z.number().positive().max(60).default(6),
  examples: z.array(parserExampleSchema).max(20).default([]),
});

export type ParseRequest = z.infer<typeof parseRequestSchema>;

export type ProductionShot = {
  shotNumber: number;
  sceneNumber: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
  voiceover: string;
  characters: string[];
  visualPrompt: string;
  cameraPlan: string;
  motionPlan: string;
  soundPlan: string;
  lighting: string;
  transition: string;
  speedTreatment: string;
  continuity: string[];
};

export type ProductionPlan = {
  targetDurationSeconds: number;
  clipDurationSeconds: number;
  totalDurationSeconds: number;
  styleBible: string;
  characterBible: string;
  shots: ProductionShot[];
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
};

export type RawShot = Omit<ProductionShot, "shotNumber" | "startTimeSeconds" | "endTimeSeconds" | "durationSeconds"> & {
  requestedDurationSeconds?: number;
};
