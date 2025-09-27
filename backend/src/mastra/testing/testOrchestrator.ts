import { OrchestratorAgent } from '../agents/orchestratorAgent';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Dedicated test suite for OrchestratorAgent
 * Tests routing logic, clarification detection, and agent selection
 */

interface OrchestratorTest {
  name: string;
  userQuery: string;
  expectedAgent?: string;
  shouldClarify?: boolean;
  description: string;
}

class OrchestratorTester {
  private agent: OrchestratorAgent;
  private context = {
    projectId: "test-project-orchestrator",
    datasetId: "test-dataset-orchestrator",
    priorActions: [],
    metadata: {}
  };

  constructor() {
    this.agent = new OrchestratorAgent();
  }

  async runAllTests(): Promise<void> {
    console.log('🎭 Testing OrchestratorAgent Routing Logic...\n');

    const tests: OrchestratorTest[] = [
      // Data Cleaning Tests
      {
        name: "Basic cleaning request",
        userQuery: "Clean my dataset and remove missing values",
        expectedAgent: "cleaner",
        description: "Should route to cleaner for basic data cleaning"
      },
      {
        name: "Advanced cleaning with options",
        userQuery: "Remove nulls, fill missing values with median, and convert data types",
        expectedAgent: "cleaner",
        description: "Should route to cleaner for advanced cleaning operations"
      },
      
      // Analysis Tests
      {
        name: "Statistical analysis request",
        userQuery: "Analyze the statistical properties of my dataset",
        expectedAgent: "analyst",
        description: "Should route to analyst for statistical analysis"
      },
      {
        name: "Descriptive statistics",
        userQuery: "Show me mean, median, and standard deviation for all numeric columns",
        expectedAgent: "analyst",
        description: "Should route to analyst for descriptive statistics"
      },
      
      // Visualization Tests
      {
        name: "Scatter plot request",
        userQuery: "Create a scatter plot showing the relationship between sales and profit",
        expectedAgent: "visualizer",
        description: "Should route to visualizer for scatter plot"
      },
      {
        name: "Multiple chart types",
        userQuery: "Generate histograms and box plots for my data distribution",
        expectedAgent: "visualizer",
        description: "Should route to visualizer for multiple chart types"
      },
      
      // Correlation Tests
      {
        name: "Correlation analysis",
        userQuery: "Find correlations between customer age and purchase amount",
        expectedAgent: "correlation",
        description: "Should route to correlation agent for correlation analysis"
      },
      {
        name: "Feature relationships",
        userQuery: "Analyze relationships between marketing spend and revenue",
        expectedAgent: "correlation",
        description: "Should route to correlation for feature relationship analysis"
      },
      
      // Modeling Tests
      {
        name: "Classification model",
        userQuery: "Build a machine learning model to predict customer churn",
        expectedAgent: "modeling",
        description: "Should route to modeling agent for classification"
      },
      {
        name: "Regression model",
        userQuery: "Train a model to predict sales revenue based on marketing spend",
        expectedAgent: "modeling",
        description: "Should route to modeling agent for regression"
      },
      
      // Explanation Tests
      {
        name: "Result interpretation",
        userQuery: "Explain what these analysis results mean in business terms",
        expectedAgent: "explainer",
        description: "Should route to explainer for result interpretation"
      },
      {
        name: "Executive summary",
        userQuery: "Provide an executive summary of the data insights",
        expectedAgent: "explainer",
        description: "Should route to explainer for executive summary"
      },
      
      // Clarification Tests
      {
        name: "Vague request",
        userQuery: "Do something with my data",
        shouldClarify: true,
        description: "Should request clarification for vague requests"
      },
      {
        name: "Missing context",
        userQuery: "Create a chart",
        shouldClarify: true,
        description: "Should request clarification when missing chart details"
      },
      {
        name: "Ambiguous analysis",
        userQuery: "Analyze this",
        shouldClarify: true,
        description: "Should request clarification for ambiguous analysis requests"
      },
      
      // Edge Cases
      {
        name: "Multi-step request",
        userQuery: "Clean the data, then create visualizations, and finally build a model",
        expectedAgent: "cleaner", // Should start with first step
        description: "Should route to first agent in multi-step workflow"
      },
      {
        name: "Complex query",
        userQuery: "I need to understand customer behavior patterns through statistical analysis and correlation studies",
        expectedAgent: "analyst", // Should prioritize statistical analysis
        description: "Should route to analyst for complex statistical requests"
      }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      const passed = await this.runTest(test);
      if (passed) passedTests++;
    }

    console.log('\n📊 ORCHESTRATOR TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  }

  private async runTest(test: OrchestratorTest): Promise<boolean> {
    try {
      console.log(`🔍 ${test.name}`);
      console.log(`   Query: "${test.userQuery}"`);
      console.log(`   Expected: ${test.expectedAgent || (test.shouldClarify ? 'clarification' : 'any agent')}`);
      
      const input = {
        projectId: "test-project-orchestrator",
        userQuery: test.userQuery,
        priorActions: []
      };

      const result = await this.agent.run(input, this.context);
      
      console.log(`   Result: ${result.action}`);
      if (result.targetAgent) {
        console.log(`   Selected Agent: ${result.targetAgent}`);
      }
      console.log(`   Reasoning: ${result.rationale}`);
      
      // Check if test passed
      let passed = false;
      
      if (test.shouldClarify) {
        passed = result.action === "clarify";
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'} - Should request clarification`);
      } else if (test.expectedAgent) {
        passed = result.action === "dispatch" && result.targetAgent === test.expectedAgent;
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'} - Should route to ${test.expectedAgent}`);
      } else {
        passed = result.action === "dispatch" && result.targetAgent;
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'} - Should route to some agent`);
      }
      
      console.log('');
      return passed;
      
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.log('');
      return false;
    }
  }

  // Test specific routing scenarios
  async testRoutingScenarios(): Promise<void> {
    console.log('\n🎯 Testing Specific Routing Scenarios...\n');

    const scenarios = [
      {
        name: "Data Science Pipeline Start",
        queries: [
          "Clean my dataset",
          "Now create visualizations",
          "Find correlations",
          "Build a prediction model",
          "Explain the results"
        ],
        expectedAgents: ["cleaner", "visualizer", "correlation", "modeling", "explainer"]
      },
      {
        name: "Business Analysis Workflow",
        queries: [
          "Analyze sales performance",
          "Show me the trends",
          "What drives customer behavior?",
          "Predict future sales"
        ],
        expectedAgents: ["analyst", "visualizer", "correlation", "modeling"]
      },
      {
        name: "Data Quality Assessment",
        queries: [
          "Check data quality",
          "Show data distribution",
          "Identify outliers",
          "Summarize findings"
        ],
        expectedAgents: ["cleaner", "analyst", "analyst", "explainer"]
      }
    ];

    for (const scenario of scenarios) {
      console.log(`📋 ${scenario.name}`);
      
      for (let i = 0; i < scenario.queries.length; i++) {
        const query = scenario.queries[i];
        const expectedAgent = scenario.expectedAgents[i];
        
        try {
          const input = {
            projectId: "test-project-orchestrator",
            userQuery: query,
            priorActions: scenario.queries.slice(0, i) // Include prior actions
          };

          const result = await this.agent.run(input, this.context);
          const passed = result.action === "dispatch" && result.targetAgent === expectedAgent;
          
          console.log(`  ${i + 1}. "${query}"`);
          console.log(`     Expected: ${expectedAgent}, Got: ${result.targetAgent || result.action}`);
          console.log(`     ${passed ? '✅' : '❌'} ${passed ? 'PASS' : 'FAIL'}`);
          
        } catch (error: any) {
          console.log(`  ${i + 1}. "${query}"`);
          console.log(`     ❌ ERROR: ${error.message}`);
        }
      }
      console.log('');
    }
  }

  // Test clarification detection
  async testClarificationDetection(): Promise<void> {
    console.log('\n❓ Testing Clarification Detection...\n');

    const clarificationTests = [
      { query: "Make a chart", shouldClarify: true, reason: "Missing chart type and data" },
      { query: "Analyze this", shouldClarify: true, reason: "Missing analysis type" },
      { query: "Build a model", shouldClarify: true, reason: "Missing model type and target" },
      { query: "Clean the data", shouldClarify: false, reason: "Clear cleaning request" },
      { query: "Create a scatter plot of sales vs profit", shouldClarify: false, reason: "Specific visualization request" },
      { query: "Find correlations between age and income", shouldClarify: false, reason: "Specific correlation request" }
    ];

    let correctDetections = 0;

    for (const test of clarificationTests) {
      try {
        const input = {
          projectId: "test-project-orchestrator",
          userQuery: test.query,
          priorActions: []
        };

        const result = await this.agent.run(input, this.context);
        const detectedClarification = result.action === "clarify";
        const correct = detectedClarification === test.shouldClarify;
        
        if (correct) correctDetections++;
        
        console.log(`Query: "${test.query}"`);
        console.log(`Expected: ${test.shouldClarify ? 'Clarification' : 'Action'}`);
        console.log(`Got: ${detectedClarification ? 'Clarification' : 'Action'}`);
        console.log(`Reason: ${test.reason}`);
        console.log(`${correct ? '✅ CORRECT' : '❌ INCORRECT'}\n`);
        
      } catch (error: any) {
        console.log(`Query: "${test.query}"`);
        console.log(`❌ ERROR: ${error.message}\n`);
      }
    }

    console.log(`Clarification Detection Accuracy: ${correctDetections}/${clarificationTests.length} (${((correctDetections / clarificationTests.length) * 100).toFixed(1)}%)`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new OrchestratorTester();
  tester.runAllTests()
    .then(() => tester.testRoutingScenarios())
    .then(() => tester.testClarificationDetection())
    .catch(console.error);
}

export { OrchestratorTester };
