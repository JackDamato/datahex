// src/agents/cleanerAgent.ts
import { mcpClient } from "../clients/mcpClient";
export type CleanerInput = { datasetId: string; columns?: string[] };
export type CleanerResult = {
  newDatasetId: string;
  summary: { droppedRows?: number; columns?: string[] };
  artifact?: any;
};
export async function runCleaner(input: CleanerInput): Promise<CleanerResult> {
  const res = await mcpClient.dropNulls(input.datasetId, input.columns) as any;
  return {
    newDatasetId: res.newDatasetId,
    summary: { droppedRows: res.rows, columns: input.columns },
  };
}