// src/agents/modelingAgent.ts
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export type TrainInput = {
  datasetId: string;
  features: string[];
  target: string;
  modelType: "classification" | "regression";
  algorithm?: string;
  testSize?: number;
  randomState?: number;
  hyperparameters?: Record<string, any>;
};

export type TrainResult = {
  metrics: any;
  feature_importance?: any;
  model_path?: string;
  savedPath?: string;
  reasoning?: string;
};

export async function runModelingTrain(input: TrainInput): Promise<TrainResult> {
  const res = await fetch(`${process.env.SANDBOX_BASE_URL}/mcp/modeling/train`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: input.datasetId,
      features: input.features,
      target: input.target,
      model_type: input.modelType,
      algorithm: input.algorithm || "random_forest",
      test_size: input.testSize ?? 0.2,
      random_state: input.randomState ?? 42,
      hyperparameters: input.hyperparameters,
    }),
  });
  if (!res.ok) throw new Error(`modeling.train failed: ${res.status} ${await res.text()}`);
  const body = await res.json() as any;
  
  // Save the model metadata to uploads directory
  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const modelId = uuidv4();
  const modelFileName = `model_${modelId}.json`;
  const modelPath = path.join(uploadsDir, modelFileName);
  
  // Save model metadata and results
  const modelData = {
    model_id: modelId,
    algorithm: input.algorithm || "random_forest",
    model_type: input.modelType,
    features: input.features,
    target: input.target,
    metrics: body.metrics,
    feature_importance: body.feature_importance,
    hyperparameters: input.hyperparameters,
    test_size: input.testSize ?? 0.2,
    random_state: input.randomState ?? 42,
    generated_at: new Date().toISOString(),
    dataset_id: input.datasetId,
    artifact_path: body.artifactPath || `model_${modelId}.pkl`
  };
  
  fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));
  
  console.log(`🤖 Model saved: ${modelPath}`);
  console.log(`📊 Metrics:`, body.metrics);
  
  return {
    metrics: body.metrics,
    feature_importance: body.feature_importance,
    model_path: body.artifactPath,
    savedPath: modelPath,
    reasoning: `Model trained and saved to ${modelPath}`
  };
}