// src/agents/dataEngineeringAgent.ts
import fetch from "node-fetch";

export type DataEngineeringOp = { op: string; args?: any };
export type DataEngineeringInput = { datasetId: string; operations: DataEngineeringOp[]; targetColumn?: string };
export type DataEngineeringResult = { newDatasetId: string; rows: number; columns: number; details?: any };

export async function runDataEngineering(input: DataEngineeringInput): Promise<DataEngineeringResult> {
  const res = await fetch(`${process.env.SANDBOX_BASE_URL}/mcp/data_engineering/engineer`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: input.datasetId,
      operations: input.operations,
      target_column: input.targetColumn,
    }),
  });
  if (!res.ok) throw new Error(`/data_engineering/engineer failed: ${res.status} ${await res.text()}`);
  const body = await res.json() as any;
  return {
    newDatasetId: body.newDatasetId,
    rows: body.rows,
    columns: body.columns,
    details: body,
  };
}