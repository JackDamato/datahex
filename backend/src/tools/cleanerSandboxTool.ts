import { Tool } from "@mastra/core/tools";
import { z } from "zod";
import { mcpClient } from "../clients/mcpClient";

const SandboxInput = z.object({
  datasetId: z.string(),
  operations: z.object({
    dropNulls: z.object({ columns: z.array(z.string()).min(1) }).optional(),
  })
});

const MOCK = process.env.SANDBOX_MOCK === "1";

export const cleanerSandboxTool = new Tool({
  id: "cleanerSandboxTool",
  description: "Executes cleaning steps in Python sandbox (e.g., drop nulls).",
  execute: async (input: unknown) => {
    const { datasetId, operations } = SandboxInput.parse(input);

    if (MOCK) {
      const nextId = operations.dropNulls ? `${datasetId}_dropnulls` : `${datasetId}_cleaned`;
      return { newDatasetId: nextId, rows: 950 };
    }

    let currentDatasetId = datasetId;
    let rowsEstimate: number | undefined;

    if (operations.dropNulls) {
      const res = await mcpClient.dropNulls(currentDatasetId, operations.dropNulls.columns) as any;
      currentDatasetId = res.newDatasetId || res.new_dataset_id || `${currentDatasetId}_cleaned`;
      rowsEstimate = res.rows ?? res.row_count ?? 950;
    }

    return { newDatasetId: currentDatasetId, rows: rowsEstimate ?? 950 };
  }
});