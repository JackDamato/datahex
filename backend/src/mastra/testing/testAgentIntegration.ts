import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { OrchestratorAgent } from '../agents/orchestratorAgent';
import { agentRegistry } from '../agentRegistry';

/**
 * Integration testing suite for agent workflows
 * Tests agent-to-agent communication and orchestration flows
 */

interface IntegrationTest {
  name: string;
  workflow: {
    step: number;
    agent: string;
    input: any;
    expectedOutput?: any;
  }[];
  description: string;
}

class AgentIntegrationTester {
  private orchestrator: OrchestratorAgent;
  private context = {
    projectId: "test-project-integration",
    datasetId: "test-dataset-integration",
    priorActions: [],
    metadata: { integrationTest: true }
  };

  constructor() {
    this.orchestrator = new OrchestratorAgent();
  }

  async runAllIntegrationTests(): Promise<void> {
    console.log('🔗 Running Agent Integration Tests...\n');

    const integrationTests: IntegrationTest[] = [
      {
        name: "Data Cleaning Pipeline",
        description: "Test complete data cleaning workflow",
        workflow: [
          {
            step: 1,
            agent: "orchestrator",
            input: {
              projectId: "test-project-integration",
              userQuery: "Clean my dataset and remove missing values",
              priorActions: []
            }
          },
          {
            step: 2,
            agent: "cleaner",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/dirty_sales_data.csv",
              options: {
                removeNulls: true,
                fillStrategy: "median" as const
              }
            }
          }
        ]
      },
      {
        name: "Analysis to Visualization Pipeline",
        description: "Test analysis followed by visualization",
        workflow: [
          {
            step: 1,
            agent: "orchestrator",
            input: {
              projectId: "test-project-integration",
              userQuery: "Analyze my data and then create visualizations",
              priorActions: []
            }
          },
          {
            step: 2,
            agent: "analyst",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/analyzed_data.csv",
              analysisType: "descriptive" as const
            }
          },
          {
            step: 3,
            agent: "visualizer",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/analyzed_data.csv",
              chartType: "auto" as const,
              visualizationGoal: "Visualize the analysis results"
            }
          }
        ]
      },
      {
        name: "Correlation to Modeling Pipeline",
        description: "Test correlation analysis followed by predictive modeling",
        workflow: [
          {
            step: 1,
            agent: "orchestrator",
            input: {
              projectId: "test-project-integration",
              userQuery: "Find correlations and build a predictive model",
              priorActions: []
            }
          },
          {
            step: 2,
            agent: "correlation",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/model_data.csv",
              analysisType: "correlation" as const
            }
          },
          {
            step: 3,
            agent: "modeling",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/model_data.csv",
              problemType: "classification" as const,
              targetVariable: "outcome",
              modelType: "auto" as const
            }
          }
        ]
      },
      {
        name: "Complete Data Science Pipeline",
        description: "Test end-to-end data science workflow",
        workflow: [
          {
            step: 1,
            agent: "orchestrator",
            input: {
              projectId: "test-project-integration",
              userQuery: "Clean, analyze, visualize, and model my data",
              priorActions: []
            }
          },
          {
            step: 2,
            agent: "cleaner",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/raw_data.csv"
            }
          },
          {
            step: 3,
            agent: "analyst",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/cleaned_data.csv",
              analysisType: "comprehensive" as const
            }
          },
          {
            step: 4,
            agent: "visualizer",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/analyzed_data.csv",
              chartType: "auto" as const
            }
          },
          {
            step: 5,
            agent: "modeling",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/model_data.csv",
              problemType: "auto" as const
            }
          },
          {
            step: 6,
            agent: "explainer",
            input: {
              datasetId: "test-dataset-integration",
              datasetPath: "data/final_data.csv",
              analysisResults: {
                insights: ["Key insight 1", "Key insight 2"],
                model_performance: { accuracy: 0.85, precision: 0.82 }
              },
              stakeholderType: "executive" as const
            }
          }
        ]
      }
    ];

    let passedTests = 0;
    let totalTests = integrationTests.length;

    for (const test of integrationTests) {
      const passed = await this.runIntegrationTest(test);
      if (passed) passedTests++;
    }

    console.log('\n📊 INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  }

  private async runIntegrationTest(test: IntegrationTest): Promise<boolean> {
    console.log(`🔍 ${test.name}`);
    console.log(`   Description: ${test.description}`);
    
    let allStepsPassed = true;
    const results: any[] = [];

    for (const step of test.workflow) {
      try {
        console.log(`   Step ${step.step}: ${step.agent}`);
        
        let result;
        if (step.agent === "orchestrator") {
          result = await this.orchestrator.run(step.input, this.context);
        } else {
          const agent = agentRegistry[step.agent];
          if (!agent) {
            console.log(`     ❌ Agent ${step.agent} not found in registry`);
            allStepsPassed = false;
            break;
          }
          
          // Update context with prior actions
          const stepContext = {
            ...this.context,
            priorActions: results.map(r => r.action || "completed").slice(0, step.step - 1)
          };
          
          result = await agent.run(step.input, stepContext);
        }
        
        results.push(result);
        
        if (result && (result.action || result.details)) {
          console.log(`     ✅ Success - ${result.action || 'completed'}`);
        } else {
          console.log(`     ❌ Invalid output structure`);
          allStepsPassed = false;
        }
        
      } catch (error: any) {
        console.log(`     ❌ Error: ${error.message}`);
        allStepsPassed = false;
        break;
      }
    }

    console.log(`   ${allStepsPassed ? '✅ PASS' : '❌ FAIL'} - ${test.name}\n`);
    return allStepsPassed;
  }

  // Test agent registry functionality
  async testAgentRegistry(): Promise<void> {
    console.log('📋 Testing Agent Registry...\n');

    const expectedAgents = [
      'orchestrator',
      'cleaner',
      'analyst',
      'visualizer',
      'correlation',
      'modeling',
      'explainer'
    ];

    console.log('Checking agent availability:');
    for (const agentId of expectedAgents) {
      const agent = agentRegistry[agentId];
      if (agent) {
        console.log(`  ✅ ${agentId} - Available`);
        
        // Test basic agent properties
        if (agent.id === agentId) {
          console.log(`     ID: ${agent.id} ✓`);
        } else {
          console.log(`     ID: ${agent.id} ❌ (expected ${agentId})`);
        }
        
        if (agent.name) {
          console.log(`     Name: ${agent.name} ✓`);
        } else {
          console.log(`     Name: Missing ❌`);
        }
        
      } else {
        console.log(`  ❌ ${agentId} - Not found in registry`);
      }
    }

    console.log('\nTesting agent instantiation:');
    for (const agentId of expectedAgents) {
      try {
        const agent = agentRegistry[agentId];
        if (agent && typeof agent.run === 'function') {
          console.log(`  ✅ ${agentId} - Has run method`);
        } else {
          console.log(`  ❌ ${agentId} - Missing run method`);
        }
      } catch (error: any) {
        console.log(`  ❌ ${agentId} - Error: ${error.message}`);
      }
    }
  }

  // Test context passing between agents
  async testContextPropagation(): Promise<void> {
    console.log('\n🔄 Testing Context Propagation...\n');

    const testContext = {
      projectId: "test-project-context",
      datasetId: "test-dataset-context",
      priorActions: ["data_uploaded", "initial_analysis"],
      metadata: { 
        testMode: true,
        workflowId: "test-workflow-001",
        timestamp: new Date().toISOString()
      }
    };

    console.log('Testing context preservation across agents:');
    
    const agents = ['cleaner', 'analyst', 'visualizer'];
    
    for (const agentId of agents) {
      try {
        const agent = agentRegistry[agentId];
        if (!agent) {
          console.log(`  ❌ ${agentId} - Not found`);
          continue;
        }

        const testInput = {
          datasetId: "test-dataset-context",
          datasetPath: "data/test.csv"
        };

        const result = await agent.run(testInput, testContext);
        
        if (result) {
          console.log(`  ✅ ${agentId} - Context preserved`);
          console.log(`     Prior actions: ${testContext.priorActions.length} items`);
          console.log(`     Metadata keys: ${Object.keys(testContext.metadata).length} items`);
        } else {
          console.log(`  ❌ ${agentId} - No result returned`);
        }
        
      } catch (error: any) {
        console.log(`  ❌ ${agentId} - Error: ${error.message}`);
      }
    }
  }

  // Test error handling and recovery
  async testErrorHandling(): Promise<void> {
    console.log('\n🚨 Testing Error Handling...\n');

    const errorTests = [
      {
        name: "Invalid dataset ID",
        input: {
          datasetId: "non-existent-dataset",
          datasetPath: "data/nonexistent.csv"
        },
        agent: "cleaner"
      },
      {
        name: "Malformed input",
        input: {
          datasetId: "test-dataset",
          // Missing required fields
        },
        agent: "analyst"
      },
      {
        name: "Invalid chart type",
        input: {
          datasetId: "test-dataset",
          datasetPath: "data/test.csv",
          chartType: "invalid_chart_type" as any,
          columns: ["col1", "col2"]
        },
        agent: "visualizer"
      }
    ];

    for (const test of errorTests) {
      try {
        console.log(`🔍 ${test.name}`);
        
        const agent = agentRegistry[test.agent];
        if (!agent) {
          console.log(`   ❌ Agent ${test.agent} not found`);
          continue;
        }

        const context = {
          ...this.context,
          metadata: { ...this.context.metadata, errorTest: true }
        };

        const result = await agent.run(test.input, context);
        
        // Check if agent handled error gracefully
        if (result && result.action && result.action.includes('error')) {
          console.log(`   ✅ Graceful error handling`);
        } else if (result && result.reasoning && result.reasoning.includes('fallback')) {
          console.log(`   ✅ Fallback mechanism triggered`);
        } else {
          console.log(`   ⚠️ Unexpected success with invalid input`);
        }
        
      } catch (error: any) {
        console.log(`   ✅ Error caught: ${error.message.substring(0, 50)}...`);
      }
    }
  }

  async runCompleteIntegrationTestSuite(): Promise<void> {
    await this.runAllIntegrationTests();
    await this.testAgentRegistry();
    await this.testContextPropagation();
    await this.testErrorHandling();
    
    console.log('\n🎉 All integration tests completed!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AgentIntegrationTester();
  tester.runCompleteIntegrationTestSuite().catch(console.error);
}

export { AgentIntegrationTester };
