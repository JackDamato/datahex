/**
 * Simple Correlation Agent - Direct MCP Integration
 * 
 * This agent performs correlation analysis by directly calling the MCP client
 * without using the complex Mastra framework.
 */

import { mcpClient, CorrelationAnalysisResponse } from "../mcpClient";

export type CorrelationAnalysisResult = CorrelationAnalysisResponse;

export class SimpleCorrelationAgent {
  name = "SimpleCorrelationAgent";
  
  async analyzeCorrelations(
    datasetId: string,
    columns?: string[],
    analysisType: string = "comprehensive"
  ): Promise<CorrelationAnalysisResult> {
    try {
      console.log(`🔗 [${this.name}] Starting correlation analysis for dataset: ${datasetId}`);
      
      // Call the MCP correlation analysis endpoint directly
      const result = await mcpClient.analyzeCorrelations({
        dataset_id: datasetId,
        columns: columns,
        analysis_type: analysisType
      });
      
      console.log(`✅ [${this.name}] Analysis completed successfully`);
      return result;
    } catch (error: any) {
      console.error(`❌ [${this.name}] Analysis failed:`, error.message);
      throw new Error(`Correlation analysis failed: ${error.message}`);
    }
  }
  
  async generateInsights(result: CorrelationAnalysisResult): Promise<string[]> {
    const insights: string[] = [];
    
    // Add basic insights
    insights.push(`Analyzed ${result.dataset_info.columns_analyzed.length} numeric columns`);
    insights.push(`Found ${result.correlations.strong.length} strong correlations`);
    insights.push(`Found ${result.correlations.moderate.length} moderate correlations`);
    
    // Add specific insights about strongest correlations
    if (result.correlations.strong.length > 0) {
      const strongest = result.correlations.strong[0];
      insights.push(`Strongest correlation: ${strongest.column1} vs ${strongest.column2} (r = ${strongest.correlation.toFixed(3)})`);
    }
    
    // Add insights about data quality
    const originalRows = result.dataset_info.original_shape[0];
    const cleanRows = result.dataset_info.clean_shape[0];
    if (originalRows !== cleanRows) {
      insights.push(`Removed ${originalRows - cleanRows} rows with missing values`);
    }
    
    return insights;
  }
}

// Create singleton instance
export const simpleCorrelationAgent = new SimpleCorrelationAgent();

// Helper function for easy usage
export async function runSimpleCorrelationAnalysis(
  datasetId: string,
  columns?: string[],
  analysisType: string = "comprehensive"
): Promise<CorrelationAnalysisResult> {
  return await simpleCorrelationAgent.analyzeCorrelations(datasetId, columns, analysisType);
}

export default SimpleCorrelationAgent;
