// src/test/test-orchestrator.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { runOrchestrator } from "../agents/orchestratorAgent";
import { getCsvPathForProject } from "../services/dataRepo";

process.env.SANDBOX_BASE_URL ||= "http://localhost:8080";

async function main() {
  const arg = process.argv[2]; // projectId or CSV path
  const prompt = process.argv.slice(3).join(" ") || "Clean the dataset: remove nulls and analyze the data";
  
  if (!arg) {
    console.log("Usage: npm run test:orchestrator <projectId|CSV_path> [prompt]");
    console.log("Example: npm run test:orchestrator proj_1 'Clean dataset and create visualization'");
    console.log("Example: npm run test:orchestrator ./uploads/mydata.csv 'Analyze sales data'");
    process.exit(1);
  }

  let projectId = arg;
  let datasetPath: string | undefined;

  // Check if it's a file path
  if (fs.existsSync(arg) && fs.statSync(arg).isFile()) {
    projectId = path.basename(arg).replace(/\.(csv|parquet)$/i, "");
    datasetPath = path.resolve(arg);
    console.log(`📁 Using CSV file: ${datasetPath}`);
  } else {
    // Try to get CSV path from database
    try {
      datasetPath = await getCsvPathForProject(projectId);
      console.log(`📊 Found CSV in database for project ${projectId}: ${datasetPath}`);
    } catch (error) {
      console.log(`⚠️  No CSV found in database for project ${projectId}, using projectId as-is`);
    }
  }

  console.log(`🚀 Running orchestrator with:`);
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Dataset Path: ${datasetPath || 'None'}`);
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Sandbox URL: ${process.env.SANDBOX_BASE_URL}`);
  console.log('');

  const result = await runOrchestrator({
    projectId,
    prompt,
    ...(datasetPath ? { datasetPath } : {}),
  } as any);

  console.log('\n📋 Orchestrator Result:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});