import OpenAI from "openai";
import { normalizeShots, validateProductionPlan } from "./timing.js";
import type { ParseRequest, ProductionPlan, RawShot } from "./types.js";

let client: OpenAI | null = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM credentials are not configured. Add LLM_API_KEY to backend/.env before parsing a script.");
  }
  client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL,
  });
  return client;
}

const productionPlanSchema = {
  type: "object",
  properties: {
    styleBible: { type: "string" },
    characterBible: { type: "string" },
    shots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sceneNumber: { type: "integer", minimum: 1 },
          voiceover: { type: "string" },
          characters: { type: "array", items: { type: "string" } },
          visualPrompt: { type: "string" },
          cameraPlan: { type: "string" },
          motionPlan: { type: "string" },
          soundPlan: { type: "string" },
          lighting: { type: "string" },
          transition: { type: "string" },
          speedTreatment: { type: "string" },
          continuity: { type: "array", items: { type: "string" } },
          requestedDurationSeconds: { type: "number", minimum: 0.1 },
        },
        required: [
          "sceneNumber",
          "voiceover",
          "characters",
          "visualPrompt",
          "cameraPlan",
          "motionPlan",
          "soundPlan",
          "lighting",
          "transition",
          "speedTreatment",
          "continuity",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["styleBible", "characterBible", "shots"],
  additionalProperties: false,
} as const;

function buildPrompt(input: ParseRequest) {
  const examples = input.examples.length
    ? `\nCREATOR EXAMPLES:\n${input.examples.map((example, index) => `Example ${index + 1}\nVoiceover: ${example.voiceover}\nVisual: ${example.visualPrompt}\nCamera: ${example.cameraPlan ?? ""}\nSound: ${example.soundPlan ?? ""}`).join("\n\n")}`
    : "";

  return `You are the Script2Cine cinematic production planner. Turn the supplied script into a coherent shot plan for an exact final runtime of ${input.targetDurationSeconds} seconds.

The preferred generated clip unit is ${input.clipDurationSeconds} seconds. Use six-second units whenever possible. If the requested runtime is not divisible by six, use a shorter final unit. Do not perform final timeline arithmetic in prose; return requestedDurationSeconds for each shot and the server will normalize the timeline.

Rules:
- Separate narrative beats instead of forcing several unrelated actions into one clip.
- Every shot must have one dominant action and one dominant camera idea.
- Use restrained slow motion only for fabric, dust, smoke, water, clouds, deliberate turns, hands, or reflective pauses.
- Use normal speed for clear physical actions unless the story beat requires emphasis.
- Use slow pans, push-ins, locked holds, matched tracking, and purposeful hard cuts.
- Preserve character appearance, wardrobe, location, direction, weather, lighting, props, and emotional state.
- Do not invent story facts that are not supported by the script.
- Return JSON only.
${examples}

SCRIPT:\n${input.scriptText}`;
}

export async function parseScript(input: ParseRequest): Promise<ProductionPlan> {
  const response = await getClient().chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-5-mini",
    messages: [
      { role: "system", content: "You are a precise cinematic production planner. Return only valid JSON." },
      { role: "user", content: buildPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "script2cine_production_plan",
        strict: true,
        schema: productionPlanSchema,
      },
    },
    max_completion_tokens: 16_000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("The language model returned an empty parser response.");

  const raw = JSON.parse(content) as { styleBible: string; characterBible: string; shots: RawShot[] };
  const clipDurationSeconds = input.clipDurationSeconds ?? 6;
  const shots = normalizeShots(raw.shots ?? [], input.targetDurationSeconds, clipDurationSeconds);
  const plan: ProductionPlan = {
    targetDurationSeconds: input.targetDurationSeconds,
    clipDurationSeconds,
    totalDurationSeconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
    styleBible: raw.styleBible ?? "",
    characterBible: raw.characterBible ?? "",
    shots,
    validation: { isValid: false, errors: [], warnings: [] },
  };

  plan.validation = validateProductionPlan(plan);
  return plan;
}

