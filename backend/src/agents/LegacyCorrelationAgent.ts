/**
 * Legacy Correlation Agent using Mastra Core
 * 
 * This agent performs comprehensive correlation analysis on datasets
 * using the legacy Mastra framework with proper tool integration.
 */

import { Agent, Tool } from "@mastra/core";
import { mcpClient } from "../mcpClient";

// Define the correlation analysis tool
export const correlationAnalysisTool: Tool = {
  name: "correlation.analyze",
  description: "Perform comprehensive correlation analysis on a dataset including Pearson/Spearman correlations, statistical significance testing, and trend analysis",
  inputSchema: {
    type: "object",
    properties: {
      dataset_id: { 
        type: "string", 
        description: "ID of the dataset to analyze" 
      },
      columns: { 
        type: "array", 
        items: { type: "string" },
        description: "Optional list of specific columns to analyze. If not provided, analyzes all numeric columns."
      },
      analysis_type: { 
        type: "string", 
        enum: ["quick", "comprehensive", "detailed"],
        description: "Type of analysis to perform"
      }
    },
    required: ["dataset_id"]
  },
  outputSchema: {
    type: "object",
    properties: {
      analysis_type: { type: "string" },
      dataset_info: { 
        type: "object",
        properties: {
          original_shape: { type: "array", items: { type: "number" } },
          clean_shape: { type: "array", items: { type: "number" } },
          columns_analyzed: { type: "array", items: { type: "string" } },
          timestamp: { type: "string" }
        }
      },
      correlation_matrices: {
        type: "object",
        properties: {
          pearson: { type: "object" },
          spearman: { type: "object" }
        }
      },
      correlations: {
        type: "object",
        properties: {
          strong: { 
            type: "array",
            items: {
              type: "object",
              properties: {
                column1: { type: "string" },
                column2: { type: "string" },
                correlation: { type: "number" },
                strength: { type: "string" },
                direction: { type: "string" },
                significance: { type: "string" },
                p_value: { type: "number" }
              }
            }
          },
          moderate: { 
            type: "array",
            items: {
              type: "object",
              properties: {
                column1: { type: "string" },
                column2: { type: "string" },
                correlation: { type: "number" },
                strength: { type: "string" },
                direction: { type: "string" },
                significance: { type: "string" },
                p_value: { type: "number" }
              }
            }
          }
        }
      },
      insights: { 
        type: "array", 
        items: { type: "string" } 
      },
      visualization_data: { type: "object" }
    }
  },
  execute: async (input: any) => {
    try {
      console.log(`🔗 [CorrelationAgent] Starting correlation analysis for dataset: ${input.dataset_id}`);
      
      // Call the MCP correlation analysis endpoint
      const result = await mcpClient.analyzeCorrelations(
        input.dataset_id,
        input.columns,
        input.analysis_type || "comprehensive"
      );
      
      console.log(`✅ [CorrelationAgent] Analysis completed successfully`);
      return result;
    } catch (error: any) {
      console.error(`❌ [CorrelationAgent] Analysis failed:`, error.message);
      throw new Error(`Correlation analysis failed: ${error.message}`);
    }
  }
};

// Create the legacy correlation agent
export const LegacyCorrelationAgent = new Agent({
  name: "LegacyCorrelationAgent",
  instructions: `
    You are a correlation analysis expert. Your role is to:
    
    1. Analyze correlations between variables in datasets
    2. Identify strong and moderate correlations
    3. Provide statistical significance testing
    4. Generate actionable insights about data relationships
    5. Create visualization-ready data for correlation heatmaps
    
    When analyzing correlations:
    - Use comprehensive analysis by default unless specified otherwise
    - Focus on statistically significant relationships
    - Provide clear explanations of correlation strength and direction
    - Highlight the most important findings
    - Suggest potential implications of the correlations found
    
    Always provide clear, actionable insights that help users understand their data better.
  `,
  tools: [correlationAnalysisTool],
  model: {
    provider: "openai",
    name: "gpt-4",
    toolChoice: "auto"
  }
});

// Helper function to run correlation analysis
export async function runCorrelationAnalysis(
  datasetId: string, 
  columns?: string[], 
  analysisType: string = "comprehensive"
) {
  try {
    console.log(`🔗 [LegacyCorrelationAgent] Starting analysis for dataset: ${datasetId}`);
    
    const result = await LegacyCorrelationAgent.generate([
      {
        role: "user",
        content: `Analyze correlations in dataset ${datasetId} with columns ${columns?.join(', ') || 'all numeric columns'} using ${analysisType} analysis`
      }
    ]);
    
    console.log(`✅ [LegacyCorrelationAgent] Analysis completed`);
    return result;
  } catch (error: any) {
    console.error(`❌ [LegacyCorrelationAgent] Failed:`, error.message);
    throw error;
  }
}

// Export for use in other modules
export default LegacyCorrelationAgent;
