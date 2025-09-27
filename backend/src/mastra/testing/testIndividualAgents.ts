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
 * Individual agent testing suite
 * Tests each agent's specific capabilities and output formats
 */

interface AgentTest {
  name: string;
  input: any;
  expectedOutput?: any;
  description: string;
}

class IndividualAgentTester {
  private context = {
    projectId: "test-project-individual",
    datasetId: "test-dataset-individual",
    priorActions: [],
    metadata: { testMode: true }
  };

  async testCleanerAgent(): Promise<void> {
    console.log('🧹 Testing CleanerAgent...\n');
    
    const agent = new CleanerAgent();
    const tests: AgentTest[] = [
      {
        name: "Basic dataset cleaning",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv"
        },
        description: "Should analyze and provide cleaning recommendations"
      },
      {
        name: "Advanced cleaning with null handling",
        input: {
          datasetId: "test-dataset-2",
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
        },
        description: "Should provide specific null handling strategies"
      },
      {
        name: "Type conversion and validation",
        input: {
          datasetId: "test-dataset-3",
          datasetPath: "data/inventory.csv",
          options: {
            removeNulls: false,
            fillStrategy: "mode" as const,
            dataTypes: {
              product_id: "string",
              price: "number",
              in_stock: "boolean"
            }
          }
        },
        description: "Should recommend data type conversions"
      }
    ];

    await this.runAgentTests("CleanerAgent", agent, tests);
  }

  async testAnalystAgent(): Promise<void> {
    console.log('📊 Testing AnalystAgent...\n');
    
    const agent = new AnalystAgent();
    const tests: AgentTest[] = [
      {
        name: "Descriptive statistics",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          analysisType: "descriptive" as const
        },
        description: "Should provide comprehensive descriptive statistics"
      },
      {
        name: "Distribution analysis",
        input: {
          datasetId: "test-dataset-2",
          datasetPath: "data/customer_data.csv",
          analysisType: "distribution" as const,
          columns: ["age", "income", "spending"]
        },
        description: "Should analyze data distributions for specified columns"
      },
      {
        name: "Data quality assessment",
        input: {
          datasetId: "test-dataset-3",
          datasetPath: "data/employee_data.csv",
          analysisType: "quality" as const
        },
        description: "Should assess data quality and identify issues"
      },
      {
        name: "Comprehensive analysis",
        input: {
          datasetId: "test-dataset-4",
          datasetPath: "data/financial_data.csv",
          analysisType: "comprehensive" as const
        },
        description: "Should provide complete statistical analysis"
      }
    ];

    await this.runAgentTests("AnalystAgent", agent, tests);
  }

  async testVisualizerAgent(): Promise<void> {
    console.log('📈 Testing VisualizerAgent...\n');
    
    const agent = new VisualizerAgent();
    const tests: AgentTest[] = [
      {
        name: "Scatter plot recommendation",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          chartType: "scatter" as const,
          columns: ["sales", "profit"],
          visualizationGoal: "Show relationship between sales and profit"
        },
        description: "Should recommend scatter plot with proper configuration"
      },
      {
        name: "Histogram for distribution",
        input: {
          datasetId: "test-dataset-2",
          datasetPath: "data/customer_data.csv",
          chartType: "histogram" as const,
          columns: ["age"],
          visualizationGoal: "Show age distribution"
        },
        description: "Should recommend histogram with proper binning"
      },
      {
        name: "Auto chart selection",
        input: {
          datasetId: "test-dataset-3",
          datasetPath: "data/time_series_data.csv",
          chartType: "auto" as const,
          visualizationGoal: "Best visualization for time series data"
        },
        description: "Should automatically select appropriate chart type"
      },
      {
        name: "Multi-variable visualization",
        input: {
          datasetId: "test-dataset-4",
          datasetPath: "data/multi_dim_data.csv",
          columns: ["category", "value", "date"],
          visualizationGoal: "Show trends across categories over time"
        },
        description: "Should recommend multi-variable visualization approach"
      }
    ];

    await this.runAgentTests("VisualizerAgent", agent, tests);
  }

  async testCorrelationAgent(): Promise<void> {
    console.log('🔗 Testing CorrelationAgent...\n');
    
    const agent = new CorrelationAgent();
    const tests: AgentTest[] = [
      {
        name: "Basic correlation analysis",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          analysisType: "correlation" as const
        },
        description: "Should identify correlations between all numeric variables"
      },
      {
        name: "Targeted correlation with specific variables",
        input: {
          datasetId: "test-dataset-2",
          datasetPath: "data/customer_data.csv",
          analysisType: "relationships" as const,
          targetVariables: ["age", "income", "spending"],
          method: "pearson" as const
        },
        description: "Should analyze correlations for specific variable set"
      },
      {
        name: "Causality analysis",
        input: {
          datasetId: "test-dataset-3",
          datasetPath: "data/marketing_data.csv",
          analysisType: "causality" as const,
          targetVariables: ["marketing_spend", "sales", "customer_acquisition"]
        },
        description: "Should attempt causality analysis for marketing variables"
      },
      {
        name: "Comprehensive correlation study",
        input: {
          datasetId: "test-dataset-4",
          datasetPath: "data/financial_data.csv",
          analysisType: "comprehensive" as const,
          method: "auto" as const
        },
        description: "Should provide comprehensive correlation analysis"
      }
    ];

    await this.runAgentTests("CorrelationAgent", agent, tests);
  }

  async testModelingAgent(): Promise<void> {
    console.log('🤖 Testing ModelingAgent...\n');
    
    const agent = new ModelingAgent();
    const tests: AgentTest[] = [
      {
        name: "Classification model recommendation",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/customer_data.csv",
          problemType: "classification" as const,
          targetVariable: "churn",
          features: ["age", "income", "usage_days", "support_tickets"],
          modelType: "tree" as const
        },
        description: "Should recommend classification approach with tree models"
      },
      {
        name: "Regression model setup",
        input: {
          datasetId: "test-dataset-2",
          datasetPath: "data/sales_data.csv",
          problemType: "regression" as const,
          targetVariable: "revenue",
          features: ["marketing_spend", "season", "competitor_price", "promotions"],
          modelType: "ensemble" as const
        },
        description: "Should recommend regression approach with ensemble methods"
      },
      {
        name: "Clustering analysis",
        input: {
          datasetId: "test-dataset-3",
          datasetPath: "data/customer_segments.csv",
          problemType: "clustering" as const,
          features: ["purchase_frequency", "avg_order_value", "customer_lifetime"],
          modelType: "auto" as const
        },
        description: "Should recommend clustering approach for customer segmentation"
      },
      {
        name: "Auto problem detection",
        input: {
          datasetId: "test-dataset-4",
          datasetPath: "data/employee_data.csv",
          problemType: "auto" as const,
          modelType: "auto" as const
        },
        description: "Should automatically detect problem type and recommend approach"
      }
    ];

    await this.runAgentTests("ModelingAgent", agent, tests);
  }

  async testExplainerAgent(): Promise<void> {
    console.log('💡 Testing ExplainerAgent...\n');
    
    const agent = new ExplainerAgent();
    
    const mockAnalysisResults = {
      correlation_matrix: {
        "sales": {"profit": 0.85, "marketing": 0.72, "season": 0.45},
        "profit": {"marketing": 0.68, "season": 0.38},
        "marketing": {"season": 0.52}
      },
      key_insights: [
        "Strong positive correlation between sales and profit (0.85)",
        "Marketing spend shows moderate correlation with sales (0.72)",
        "Seasonal effects are present but moderate (0.45)"
      ],
      recommendations: [
        "Focus marketing efforts during peak seasons",
        "Optimize profit margins to drive sales growth",
        "Consider seasonal pricing strategies"
      ]
    };

    const tests: AgentTest[] = [
      {
        name: "Executive summary",
        input: {
          datasetId: "test-dataset-1",
          datasetPath: "data/sales_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "executive" as const,
          focusArea: "business_impact"
        },
        description: "Should provide high-level executive summary"
      },
      {
        name: "Technical explanation",
        input: {
          datasetId: "test-dataset-2",
          datasetPath: "data/customer_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "technical" as const,
          focusArea: "methodology"
        },
        description: "Should provide detailed technical explanation"
      },
      {
        name: "Business user explanation",
        input: {
          datasetId: "test-dataset-3",
          datasetPath: "data/employee_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "business" as const,
          focusArea: "actionable_insights"
        },
        description: "Should provide business-focused actionable insights"
      },
      {
        name: "General audience summary",
        input: {
          datasetId: "test-dataset-4",
          datasetPath: "data/financial_data.csv",
          analysisResults: mockAnalysisResults,
          stakeholderType: "general" as const,
          focusArea: "key_findings"
        },
        description: "Should provide accessible summary for general audience"
      }
    ];

    await this.runAgentTests("ExplainerAgent", agent, tests);
  }

  private async runAgentTests(agentName: string, agent: any, tests: AgentTest[]): Promise<void> {
    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      try {
        console.log(`🔍 ${test.name}`);
        console.log(`   Description: ${test.description}`);
        console.log(`   Input: ${JSON.stringify(test.input, null, 2).substring(0, 100)}...`);
        
        const startTime = Date.now();
        const result = await agent.run(test.input, this.context);
        const duration = Date.now() - startTime;
        
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Output: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
        
        // Basic validation - check if result has expected structure
        const isValid = this.validateAgentOutput(agentName, result);
        if (isValid) {
          passedTests++;
          console.log(`   ✅ PASS - Valid output structure`);
        } else {
          console.log(`   ❌ FAIL - Invalid output structure`);
        }
        
      } catch (error: any) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
      
      console.log('');
    }

    console.log(`📊 ${agentName} Results: ${passedTests}/${totalTests} tests passed (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`);
  }

  private validateAgentOutput(agentName: string, output: any): boolean {
    if (!output || typeof output !== 'object') {
      return false;
    }

    // Common validation for all agents
    if (!output.action && !output.details && !output.reasoning) {
      return false;
    }

    // Agent-specific validation
    switch (agentName) {
      case 'CleanerAgent':
        return output.action && (output.action.includes('complete') || output.action.includes('error'));
      
      case 'AnalystAgent':
        return output.action && output.insights && Array.isArray(output.insights);
      
      case 'VisualizerAgent':
        return output.action && output.recommendedChartType && output.configuration;
      
      case 'CorrelationAgent':
        return output.action && output.correlations && Array.isArray(output.correlations);
      
      case 'ModelingAgent':
        return output.action && output.problemType && output.recommendedModels && Array.isArray(output.recommendedModels);
      
      case 'ExplainerAgent':
        return output.action && output.executiveSummary && output.keyInsights && Array.isArray(output.keyInsights);
      
      default:
        return true; // Basic validation passed
    }
  }

  async runAllIndividualTests(): Promise<void> {
    console.log('🧪 Running Individual Agent Tests...\n');
    console.log('='.repeat(60));

    await this.testCleanerAgent();
    await this.testAnalystAgent();
    await this.testVisualizerAgent();
    await this.testCorrelationAgent();
    await this.testModelingAgent();
    await this.testExplainerAgent();

    console.log('🎉 All individual agent tests completed!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new IndividualAgentTester();
  tester.runAllIndividualTests().catch(console.error);
}

export { IndividualAgentTester };
