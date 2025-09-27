import "dotenv/config";
import { runCleaner } from "../agents/cleanerAgent";

async function main() {
  try {
    const res = await runCleaner({
      datasetId: "ds_123",
      columns: ["name", "age", "email"]
    });
    console.log("Cleaner result:\n", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Cleaner test failed:", err);
    process.exit(1);
  }
}

main();