/**
 * Test script for Simple Correlation Agent
 * 
 * This script tests the simple correlation agent with real data
 * and verifies end-to-end functionality.
 */

import { 
  SimpleCorrelationAgent, 
  runSimpleCorrelationAnalysis,
  CorrelationAnalysisResult 
} from "./agents/SimpleCorrelationAgent";
import { mcpClient } from "./mcpClient";

async function testSimpleCorrelationAgent() {
  console.log("🔗 Testing Simple Correlation Agent...\n");

  try {
    // Test 1: Check sandbox health
    console.log("1. 🏥 Testing sandbox health...");
    const health = await mcpClient.healthCheck();
    console.log(`   ✅ Sandbox status: ${health.status}`);
    console.log(`   📝 Message: ${health.message}\n`);

    // Test 2: Test correlation analysis with sample data
    console.log("2. 📊 Testing correlation analysis...");
    const correlationResult = await runSimpleCorrelationAnalysis(
      "sample_data.csv",
      ["age", "salary", "score"],
      "comprehensive"
    );
    
    console.log("   ✅ Correlation analysis completed");
    console.log(`   📈 Analysis type: ${correlationResult.analysis_type}`);
    console.log(`   📊 Dataset info:`, correlationResult.dataset_info);
    console.log(`   🔗 Strong correlations: ${correlationResult.correlations.strong.length}`);
    console.log(`   🔗 Moderate correlations: ${correlationResult.correlations.moderate.length}`);
    console.log(`   💡 Insights: ${correlationResult.insights.length} generated\n`);

    // Test 3: Test with different analysis types
    console.log("3. ⚡ Testing quick analysis...");
    const quickResult = await runSimpleCorrelationAnalysis(
      "sample_data.csv",
      undefined,
      "quick"
    );
    
    console.log("   ✅ Quick analysis completed");
    console.log(`   📈 Analysis type: ${quickResult.analysis_type}\n`);

    // Test 4: Test agent directly
    console.log("4. 🤖 Testing agent directly...");
    const agent = new SimpleCorrelationAgent();
    const agentResult = await agent.analyzeCorrelations(
      "sample_data.csv",
      ["age", "salary"],
      "comprehensive"
    );
    
    console.log("   ✅ Agent execution completed");
    console.log(`   📊 Agent result: ${agentResult.correlations.strong.length} strong correlations found\n`);

    // Test 5: Test insight generation
    console.log("5. 💡 Testing insight generation...");
    const insights = await agent.generateInsights(correlationResult);
    console.log("   ✅ Insights generated:");
    insights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });
    console.log();

    console.log("🎉 All tests passed! Simple Correlation Agent is working correctly.");

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSimpleCorrelationAgent()
    .then(() => {
      console.log("\n✅ Test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}

export { testSimpleCorrelationAgent };
