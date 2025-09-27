import { OrchestratorAgent } from '../agents/orchestratorAgent';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import { CleanerAgent } from '../agents/cleanerAgent';
import { AnalystAgent } from '../agents/analystAgent';
import { VisualizerAgent } from '../agents/visualizerAgent';
import { CorrelationAgent } from '../agents/correlationAgent';
import { ModelingAgent } from '../agents/modelingAgent';
import { ExplainerAgent } from '../agents/explainerAgent';

/**
 * Comprehensive test suite for all 7 Mastra agents
 * Tests each agent with realistic input scenarios
 */

interface TestResult {
  agentName: string;
  testName: string;
  input: any;
  output: any;
  success: boolean;
  error?: string;
  duration: number;
}

class AgentTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting comprehensive agent testing...\n');

    // Test each agent individually
    await this.testOrchestratorAgent();
    await this.testCleanerAgent();
    await this.testAnalystAgent();
    await this.testVisualizerAgent();
    await this.testCorrelationAgent();
    await this.testModelingAgent();
    await this.testExplainerAgent();

    // Generate summary report
    this.generateSummary();
  }

  private async testOrchestratorAgent(): Promise<void> {
    console.log('🎭 Testing OrchestratorAgent...');
    
    const agent = new OrchestratorAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const tests = [
      {
        name: "Data cleaning request",
        input: {
          projectId: "test-project-1",
          userQuery: "Clean my dataset and remove missing values",
          priorActions: []
        }
      },
      {
        name: "Visualization request",
        input: {
          projectId: "test-project-1",
          userQuery: "Create a scatter plot of sales vs profit",
          priorActions: []
        }
      },
      {
        name: "Analysis request",
        input: {
          projectId: "test-project-1",
          userQuery: "Analyze the correlation between customer age and purchase amount",
          priorActions: []
        }
      },
      {
        name: "Modeling request",
        input: {
          projectId: "test-project-1",
          userQuery: "Build a machine learning model to predict customer churn",
          priorActions: []
        }
      },
      {
        name: "Vague request (should trigger clarification)",
        input: {
          projectId: "test-project-1",
          userQuery: "Do something with my data",
          priorActions: []
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("OrchestratorAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async testCleanerAgent(): Promise<void> {
    console.log('🧹 Testing CleanerAgent...');
    
    const agent = new CleanerAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const tests = [
      {
        name: "Basic cleaning",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv"
        }
      },
      {
        name: "Advanced cleaning with options",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          options: {
            removeNulls: true,
            fillStrategy: "median" as const,
            dataTypes: {
              customer_id: "string",
              age: "number",
              purchase_date: "datetime"
            }
          }
        }
      },
      {
        name: "Selective column cleaning",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/inventory.csv",
          options: {
            removeNulls: false,
            fillStrategy: "mean" as const
          }
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("CleanerAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async testAnalystAgent(): Promise<void> {
    console.log('📊 Testing AnalystAgent...');
    
    const agent = new AnalystAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const tests = [
      {
        name: "Descriptive statistics",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          analysisType: "descriptive" as const
        }
      },
      {
        name: "Distribution analysis",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          analysisType: "distribution" as const,
          columns: ["age", "income", "spending"]
        }
      },
      {
        name: "Comprehensive analysis",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/employee_data.csv",
          analysisType: "comprehensive" as const
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("AnalystAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async testVisualizerAgent(): Promise<void> {
    console.log('📈 Testing VisualizerAgent...');
    
    const agent = new VisualizerAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const tests = [
      {
        name: "Scatter plot",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          chartType: "scatter" as const,
          columns: ["sales", "profit"],
          visualizationGoal: "Show relationship between sales and profit"
        }
      },
      {
        name: "Histogram",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          chartType: "histogram" as const,
          columns: ["age"],
          visualizationGoal: "Show age distribution"
        }
      },
      {
        name: "Auto chart selection",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/time_series_data.csv",
          chartType: "auto" as const,
          visualizationGoal: "Best visualization for time series data"
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("VisualizerAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async testCorrelationAgent(): Promise<void> {
    console.log('🔗 Testing CorrelationAgent...');
    
    const agent = new CorrelationAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const tests = [
      {
        name: "Basic correlation analysis",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          analysisType: "correlation" as const
        }
      },
      {
        name: "Targeted correlation with specific variables",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          analysisType: "relationships" as const,
          targetVariables: ["age", "income", "spending"],
          method: "pearson" as const
        }
      },
      {
        name: "Comprehensive correlation analysis",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/financial_data.csv",
          analysisType: "comprehensive" as const,
          method: "auto" as const
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("CorrelationAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async testModelingAgent(): Promise<void> {
    console.log('🤖 Testing ModelingAgent...');
    
    const agent = new ModelingAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const tests = [
      {
        name: "Classification model",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          problemType: "classification" as const,
          targetVariable: "churn",
          features: ["age", "income", "usage_days"],
          modelType: "tree" as const
        }
      },
      {
        name: "Regression model",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          problemType: "regression" as const,
          targetVariable: "revenue",
          features: ["marketing_spend", "season", "competitor_price"],
          modelType: "ensemble" as const
        }
      },
      {
        name: "Auto problem detection",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/employee_data.csv",
          problemType: "auto" as const,
          modelType: "auto" as const
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("ModelingAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async testExplainerAgent(): Promise<void> {
    console.log('💡 Testing ExplainerAgent...');
    
    const agent = new ExplainerAgent();
    const context = {
      projectId: "test-project-1",
      datasetId: "test-dataset-1",
      priorActions: [],
      metadata: {}
    };

    const mockAnalysisResults = {
      correlation_matrix: {
        "sales": {"profit": 0.85, "marketing": 0.72},
        "profit": {"marketing": 0.68}
      },
      insights: [
        "Strong positive correlation between sales and profit",
        "Marketing spend shows moderate correlation with sales"
      ]
    };

    const tests = [
      {
        name: "Executive summary",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "executive" as const,
          focusArea: "business_impact"
        }
      },
      {
        name: "Technical explanation",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "technical" as const,
          focusArea: "methodology"
        }
      },
      {
        name: "General audience",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/employee_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "general" as const,
          focusArea: "key_findings"
        }
      }
    ];

    for (const test of tests) {
      await this.runTest("ExplainerAgent", test.name, test.input, context, agent);
    }
    console.log('');
  }

  private async runTest(agentName: string, testName: string, input: any, context: any, agent: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🔍 ${testName}...`);
      const output = await agent.run(input, context);
      const duration = Date.now() - startTime;
      
      this.results.push({
        agentName,
        testName,
        input,
        output,
        success: true,
        duration
      });
      
      console.log(`    ✅ Success (${duration}ms)`);
      console.log(`    📤 Output: ${JSON.stringify(output, null, 2).substring(0, 100)}...`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        agentName,
        testName,
        input,
        output: null,
        success: false,
        error: error.message,
        duration
      });
      
      console.log(`    ❌ Failed (${duration}ms): ${error.message}`);
    }
  }

  private generateSummary(): void {
    console.log('\n📋 TEST SUMMARY REPORT');
    console.log('='.repeat(50));
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📊 BY AGENT:');
    const agentStats = this.results.reduce((acc, result) => {
      if (!acc[result.agentName]) {
        acc[result.agentName] = { total: 0, success: 0 };
      }
      acc[result.agentName].total++;
      if (result.success) acc[result.agentName].success++;
      return acc;
    }, {} as Record<string, { total: number; success: number }>);
    
    Object.entries(agentStats).forEach(([agent, stats]) => {
      const rate = ((stats.success / stats.total) * 100).toFixed(1);
      console.log(`  ${agent}: ${stats.success}/${stats.total} (${rate}%)`);
    });
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  ${result.agentName} - ${result.testName}: ${result.error}`);
        });
    }
    
    console.log('\n⏱️ PERFORMANCE:');
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
    
    const slowTests = this.results.filter(r => r.duration > 1000);
    if (slowTests.length > 0) {
      console.log('\n🐌 SLOW TESTS (>1000ms):');
      slowTests.forEach(test => {
        console.log(`  ${test.agentName} - ${test.testName}: ${test.duration}ms`);
      });
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new AgentTestRunner();
  runner.runAllTests().catch(console.error);
}

export { AgentTestRunner };
