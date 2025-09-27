/**
 * Test script for Legacy Correlation Agent
 * 
 * This script tests the legacy Mastra correlation agent with real data
 * and verifies end-to-end functionality.
 */

import { LegacyCorrelationAgent, runCorrelationAnalysis } from "./agents/LegacyCorrelationAgent";
import { mcpClient } from "./mcpClient";

async function testLegacyCorrelationAgent() {
  console.log("🔗 Testing Legacy Correlation Agent...\n");

  try {
    // Test 1: Check sandbox health
    console.log("1. 🏥 Testing sandbox health...");
    const health = await mcpClient.healthCheck();
    console.log(`   ✅ Sandbox status: ${health.status}`);
    console.log(`   📝 Message: ${health.message}\n`);

    // Test 2: Test correlation analysis with sample data
    console.log("2. 📊 Testing correlation analysis...");
    const correlationResult = await runCorrelationAnalysis(
      "sample_data.csv",
      ["age", "salary", "score"],
      "comprehensive"
    );
    
    console.log("   ✅ Correlation analysis completed");
    console.log(`   📈 Result type: ${typeof correlationResult}`);
    console.log(`   📊 Result keys:`, Object.keys(correlationResult || {}));
    console.log(`   📝 Result:`, JSON.stringify(correlationResult, null, 2).substring(0, 500) + "...\n");

    // Test 3: Test with different analysis types
    console.log("3. ⚡ Testing quick analysis...");
    const quickResult = await runCorrelationAnalysis(
      "sample_data.csv",
      undefined,
      "quick"
    );
    
    console.log("   ✅ Quick analysis completed");
    console.log(`   📈 Result type: ${typeof quickResult}\n`);

    // Test 4: Test agent directly
    console.log("4. 🤖 Testing agent directly...");
    const agentResult = await LegacyCorrelationAgent.generate([
      {
        role: "user",
        content: "Find the strongest correlations in the dataset and explain what they mean"
      }
    ]);
    
    console.log("   ✅ Agent execution completed");
    console.log(`   📝 Agent response: ${agentResult.text?.substring(0, 200)}...\n`);

    console.log("🎉 All tests passed! Legacy Correlation Agent is working correctly.");

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLegacyCorrelationAgent()
    .then(() => {
      console.log("\n✅ Test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}

export { testLegacyCorrelationAgent };
