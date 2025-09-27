import express from "express";
import { runOrchestrator } from "../agents/orchestratorAgent";
export const router = express.Router();

router.post("/orchestrate", async (req, res) => {
  try {
    const { projectId, userMessage } = req.body;
    const out = await runOrchestrator({ projectId, userMessage });
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});