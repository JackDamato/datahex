// src/agents/vizAgent.ts
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export type VizInput = { datasetId: string; chart: string; columns: string[]; options?: any };
export type VizResult = { kind: string; spec?: any; imageUrl?: string; reasoning?: string; savedPath?: string };

export async function runViz(input: VizInput): Promise<VizResult> {
  const res = await fetch(`${process.env.SANDBOX_BASE_URL}/mcp/visualization/generate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: input.datasetId,
      chart_type: input.chart,
      columns: input.columns,
      options: input.options,
    }),
  });
  if (!res.ok) throw new Error(`viz.generate failed: ${res.status} ${await res.text()}`);
  const body = await res.json() as any;
  
  // Save the chart to uploads directory
  const uploadsDir = path.join(__dirname, "..", "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const chartId = uuidv4();
  const chartFileName = `chart_${chartId}.json`;
  const chartPath = path.join(uploadsDir, chartFileName);
  
  // Save Plotly JSON spec
  const chartData = {
    chart_type: body.chart_type,
    plotly_json: body.plotly_json,
    columns: input.columns,
    options: input.options,
    generated_at: new Date().toISOString(),
    dataset_id: input.datasetId
  };
  
  fs.writeFileSync(chartPath, JSON.stringify(chartData, null, 2));
  
  // Generate actual PNG image from Plotly JSON
  let imagePath: string | undefined;
  try {
    const imageFileName = `chart_${chartId}.png`;
    imagePath = path.join(uploadsDir, imageFileName);
    
    // Use the sandbox to generate the actual PNG image
    const imageRes = await fetch(`${process.env.SANDBOX_BASE_URL}/mcp/visualization/generate`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataset_id: input.datasetId,
        chart_type: input.chart,
        columns: input.columns,
        options: { ...input.options, format: "png", width: 800, height: 600 }
      }),
    });
    
    if (imageRes.ok) {
      const imageBody = await imageRes.json() as any;
      if (imageBody.png_data) {
        // Decode base64 PNG data and save as file
        const pngBuffer = Buffer.from(imageBody.png_data, 'base64');
        fs.writeFileSync(imagePath, pngBuffer);
        console.log(`📊 Chart JSON saved: ${chartPath}`);
        console.log(`🖼️  Chart PNG saved: ${imagePath}`);
      } else {
        console.log(`📊 Chart JSON saved: ${chartPath}`);
        console.log(`⚠️  No PNG data received from sandbox`);
      }
    } else {
      console.log(`📊 Chart JSON saved: ${chartPath}`);
      console.log(`⚠️  Failed to generate PNG: ${imageRes.status}`);
    }
  } catch (error) {
    console.log(`📊 Chart JSON saved: ${chartPath}`);
    console.log(`⚠️  Error generating PNG: ${error}`);
  }
  
  return { 
    kind: body.chart_type, 
    spec: body.plotly_json, 
    reasoning: `Generated chart and saved to ${chartPath}`,
    savedPath: chartPath,
    imageUrl: imagePath
  };
}