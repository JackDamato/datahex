// backend/src/routes/mvp.ts
import { Router } from "express";
import { runCleaner } from "../agents/CleanerAgent";

export const mvpRouter = Router();

mvpRouter.post("/run-clean", async (req, res) => {
  try {
    const { datasetPath, columns } = req.body || {};
    if (!datasetPath) return res.status(400).json({ error: "datasetPath required" });
    const result = await runCleaner(datasetPath, Array.isArray(columns) ? columns : undefined);
    return res.json({ ok: true, result });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "unknown error" });
  }
});
