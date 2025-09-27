import fetch from "node-fetch";
import { Response } from "node-fetch";

// src/clients/mcpClient.ts
const BASE = process.env.SANDBOX_BASE_URL || "http://localhost:8080";
async function jsonOrThrow(res: Response, ctx: string) {
  if (!res.ok) throw new Error(`${ctx} ${res.status}: ${await res.text()}`);
  return res.json();
}
export const mcpClient = {
  async registerDataset(project_id: string, csv_path: string) {
    const res = await fetch(`${BASE}/mcp/datasets/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id, csv_path }),
    });
    return jsonOrThrow(res, "registerDataset");
  },
  async getDatasetInfo(dataset_id: string) {
    const res = await fetch(`${BASE}/mcp/datasets/info`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id }),
    });
    return jsonOrThrow(res, "datasets.info");
  },
  async dropNulls(dataset_id: string, columns?: string[]) {
    const res = await fetch(`${BASE}/mcp/clean/drop_nulls`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id, columns }),
    });
    return jsonOrThrow(res, "drop_nulls");
  },
  // add wrappers for other endpoints as you implement the agents below
};