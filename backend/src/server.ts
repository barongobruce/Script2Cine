import "dotenv/config";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { parseScript } from "./parser.js";
import { parseRequestSchema } from "./types.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "script2cine-parser" });
});

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
