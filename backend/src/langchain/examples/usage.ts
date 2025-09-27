/**
 * Example usage of the LangChain Agent System
 * Demonstrates how to use the migrated system
 */

import { setupLangChainSystem } from '../index';

async function exampleUsage() {
  console.log('🚀 Starting LangChain Agent System Example...\n');

  // Initialize the complete system
  const orchestrator = setupLangChainSystem();

  // Example project context
  const projectContext = {
    projectId: "example-project-123",
    datasetId: "dataset-456",
    priorActions: ["uploaded dataset", "initial exploration"],
    metadata: {
      datasetPath: "/data/dataset-456.csv",
      rows: 1000,
      columns: 15
    }
  };

  // Test queries
  const testQueries = [
    "Clean my dataset and remove missing values",
    "Analyze the statistical properties of my data",
    "Create a scatter plot showing sales vs profit",
    "Find correlations between customer age and purchase amount",
    "Build a machine learning model to predict customer churn",
    "Explain what these analysis results mean"
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing query: "${query}"`);
    console.log('─'.repeat(60));

    try {
      const result = await orchestrator.run(query, projectContext);
      
      console.log(`✅ Result: ${result.action}`);
      if (result.targetAgent) {
        console.log(`🎯 Target Agent: ${result.targetAgent}`);
      }
      if (result.rationale) {
        console.log(`💭 Reasoning: ${result.rationale}`);
      }
      if (result.question) {
        console.log(`❓ Question: ${result.question}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing query:`, error);
    }
  }

  console.log('\n🎉 LangChain Agent System example completed!');
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };
