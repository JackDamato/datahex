// src/agents/orchestratorAgent.ts
import OpenAI from "openai";
import { getCsvPathForProject } from "../services/dataRepo";
import { mcpClient } from "../clients/mcpClient";
import { runCleaner } from "./cleanerAgent";
import { runDataEngineering } from "./dataeAgent";
import { runViz } from "./vizAgent";
import { runCorrelationAnalyze } from "./corrAgent";
import { runModelingTrain } from "./modelAgent";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type OrchestratorInput = { projectId: string; userMessage?: string; prompt?: string };
type OrchestratorOutput = { projectId: string; datasetId: string; action: string; cards: any[]; warnings: string[]; reasoning?: string };

export async function runOrchestrator(input: OrchestratorInput & { datasetPath?: string }): Promise<OrchestratorOutput> {
  // 1) Resolve CSV and register dataset
  let csvPath: string;
  if (input.datasetPath) {
    csvPath = input.datasetPath;
  } else {
    csvPath = await getCsvPathForProject(input.projectId);
  }
  const reg = await mcpClient.registerDataset(input.projectId, csvPath) as any;
  const datasetId = reg.dataset_id;

  // 2) Get dataset info
  const info = await mcpClient.getDatasetInfo(datasetId) as any;
  const columns = Object.keys(info.dtypes || {});

  // 3) Classify intent with OpenAI (simple JSON schema)
  const sys = "You are a routing assistant. Classify the user request into one intent: clean_data | data_engineering | visualization | correlation | modeling. Extract parameters JSON only.";
  const userMessage = input.userMessage || input.prompt || "Clean the dataset";
  const usr = `UserMessage: ${userMessage}\nColumns: ${columns.join(", ")}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
  });
  const parsed = JSON.parse(completion.choices[0].message.content || "{}");
  const intent = parsed.intent || "unknown";
  const params = parsed.params || {};
  const cards: any[] = [];
  const warnings: string[] = [];

  // 4) Route
  if (intent === "clean_data") {
    const cols = (params.columns as string[] | undefined)?.filter(c => columns.includes(c));
    if ((params.columns?.length || 0) && (!cols || cols.length === 0)) warnings.push("Requested columns not found; dropping rows with any nulls.");
    const res = await runCleaner({ datasetId, columns: cols });
    cards.push({ type: "dataset", datasetId: res.newDatasetId });
    cards.push({ type: "text", text: `Dropped nulls${cols?.length ? " in " + cols.join(", ") : ""}.` });
    return { projectId: input.projectId, datasetId: res.newDatasetId, action: "clean", cards, warnings };
  }

  if (intent === "data_engineering") {
    const ops = params.operations || []; // expect array of { op, args }
    const res = await runDataEngineering({ datasetId, operations: ops, targetColumn: params.target });
    cards.push({ type: "dataset", datasetId: res.newDatasetId });
    cards.push({ type: "text", text: `Applied ${ops.length} data ops.` });
    return { projectId: input.projectId, datasetId: res.newDatasetId, action: "data_engineering", cards, warnings };
  }

  if (intent === "visualization") {
    const chart = params.chart || "histogram";
    const x = params.x ? [params.x] : [];
    const y = params.y ? [params.y] : [];
    const cols = [...x, ...y].filter(c => columns.includes(c));
    if (cols.length === 0) warnings.push("No valid columns for visualization.");
    const viz = await runViz({ datasetId, chart, columns: cols, options: params.options });
    cards.push({ type: "chart", kind: viz.kind, spec: viz.spec, savedPath: viz.savedPath });
    cards.push({ type: "text", text: viz.reasoning || "Chart generated successfully" });
    return { projectId: input.projectId, datasetId, action: "visualization", cards, warnings };
  }

  if (intent === "correlation") {
    const sel = (params.columns as string[] | undefined)?.filter(c => columns.includes(c));
    const corr = await runCorrelationAnalyze(datasetId, sel?.length ? sel : undefined, params.analysis_type) as any;
    cards.push({ type: "metrics", task: "correlation", metrics: corr.statistics || {} });
    cards.push({ type: "text", text: "Correlation analysis complete." });
    return { projectId: input.projectId, datasetId, action: "correlation", cards, warnings };
  }

  if (intent === "modeling") {
    const features = (params.features as string[] | undefined)?.filter(c => columns.includes(c)) || [];
    const target = params.target;
    if (!target || !columns.includes(target)) {
      warnings.push("Please specify a valid target column for modeling.");
      return { projectId: input.projectId, datasetId, action: "modeling", cards: [{ type: "warning", text: warnings[0] }], warnings };
    }
    const res = await runModelingTrain({
      datasetId,
      features,
      target,
      modelType: params.model_type || "classification",
      algorithm: params.algorithm,
      testSize: params.test_size,
      randomState: params.random_state,
      hyperparameters: params.hyperparameters,
    });
    cards.push({ type: "metrics", task: "modeling", metrics: res.metrics, savedPath: res.savedPath });
    cards.push({ type: "text", text: res.reasoning || "Model trained successfully" });
    return { projectId: input.projectId, datasetId, action: "modeling", cards, warnings };
  }

  // Fallback
  cards.push({ type: "text", text: "I can clean data, run data engineering, visualize, analyze correlation, or train models. Try: 'remove nulls in age' or 'scatter of age vs score'." });
  return { projectId: input.projectId, datasetId, action: "unknown", cards, warnings };
}