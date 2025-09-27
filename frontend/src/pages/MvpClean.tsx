import { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export default function MvpClean() {
  const [datasetPath, setDatasetPath] = useState("/data/raw/sample.parquet");
  const [columns, setColumns] = useState("");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setOut(null);
    const body = {
      datasetPath,
      columns: columns.trim() ? columns.split(",").map(s => s.trim()) : undefined
    };
    const r = await fetch(`${BACKEND}/mvp/run-clean`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    setOut(j);
    setLoading(false);
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <h2>Mastra MVP — CleanerAgent → MCP drop_nulls</h2>
      <label>Dataset path (sandbox-visible):</label>
      <input value={datasetPath} onChange={e => setDatasetPath(e.target.value)} style={{ width: "100%", margin: "8px 0" }} />
      <label>Columns (comma-separated, optional):</label>
      <input value={columns} onChange={e => setColumns(e.target.value)} style={{ width: "100%", margin: "8px 0" }} />
      <button onClick={run} disabled={loading} style={{ padding: "8px 12px" }}>
        {loading ? "Running..." : "Run CleanerAgent"}
      </button>
      <pre style={{ marginTop: 12, background: "#111", color: "#0f0", padding: 12, borderRadius: 8 }}>
        {out ? JSON.stringify(out, null, 2) : "// output here"}
      </pre>
    </div>
  );
}
