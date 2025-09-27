// src/agents/correlationAgent.ts
import fetch from "node-fetch";

export async function runCorrelationAnalyze(datasetId: string, columns?: string[], analysisType?: string) {
    const res = await fetch(`${process.env.SANDBOX_BASE_URL}/mcp/correlation/analyze`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, columns, analysis_type: analysisType || "comprehensive" }),
    });
    if (!res.ok) throw new Error(`correlation.analyze failed: ${res.status} ${await res.text()}`);
    return res.json() as any;
  }
  export async function runCorrelationReport(datasetId: string, columns?: string[]) {
    const res = await fetch(`${process.env.SANDBOX_BASE_URL}/mcp/correlation/report`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, columns }),
    });
    if (!res.ok) throw new Error(`correlation.report failed: ${res.status} ${await res.text()}`);
    return res.json() as any; // { html_report, report_path }
  }