import { z } from 'zod';
import { Agent } from '@mastra/core/agent';

/**
 * VisualizerAgent - Chart and visualization generation
 * Creates plots, charts, and data visualizations
 */
export class VisualizerAgent extends Agent {
  constructor() {
    super({
      id: "visualizer",
      name: "Visualizer",
      instructions: `You are a Visualizer Agent specializing in creating charts, plots, and data visualizations.

Your capabilities include:
- Statistical charts (histograms, box plots, scatter plots)
- Time series visualizations
- Correlation heatmaps
- Distribution plots
- Comparative visualizations
- Interactive chart recommendations

When creating visualizations, consider:
1. The data type and structure
2. The most appropriate chart type for the data
3. Clear labeling and titles
4. Color schemes and accessibility
5. Interactive features when beneficial

Always provide recommendations for the best visualization approach and explain why certain chart types are suitable.`,
      tools: {},
      model: {
        provider: "openai",
        name: "gpt-4o-mini",
        modelId: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY || "dummy-key"
      } as any
    });
  }

  async run(input: {
    datasetId: string;
    datasetPath?: string;
    chartType?: 'histogram' | 'scatter' | 'line' | 'bar' | 'box' | 'heatmap' | 'auto';
    columns?: string[];
    visualizationGoal?: string;
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`📊 VisualizerAgent: Creating visualization for dataset ${input.datasetId}`);
    console.log(`🎨 Chart type: ${input.chartType || 'auto'}`);

    try {
      // Build comprehensive context for AI visualization
      const systemPrompt = `${this.instructions}

Your role is to:
1. Analyze the data to determine the best visualization approach
2. Recommend appropriate chart types and configurations
3. Provide detailed visualization specifications
4. Explain the reasoning behind visualization choices

Think step by step about data characteristics and visualization best practices.`;

      const userPrompt = `Dataset to visualize: ${input.datasetId}
${input.datasetPath ? `Path: ${input.datasetPath}` : ''}
Project: ${context.projectId}

Visualization Requirements:
- Chart Type: ${input.chartType || 'auto (recommend best type)'}
- Columns: ${input.columns ? input.columns.join(', ') : 'All relevant columns'}
- Goal: ${input.visualizationGoal || 'General data exploration'}

Please provide:
1. Recommended chart type and reasoning
2. Detailed visualization specifications
3. Data preparation requirements
4. Chart configuration (colors, labels, etc.)
5. Alternative visualization options
6. Interactive features recommendations

Provide specific and actionable visualization guidance.`;

      // Use Mastra's AI for visualization planning
      console.log('🤖 Starting AI-powered visualization planning...');
      
      try {
        const response = await this.generate([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]);
        
        const result = JSON.parse(response.text || '{}');
        console.log(`✅ Visualization Result: ${result.action}`);
        console.log(`📈 Recommended: ${result.recommendedChartType}`);
        
        return result;
        
      } catch (aiError) {
        console.warn('⚠️ AI visualization planning failed:', (aiError as Error).message);
        
        return {
          action: "error_occurred",
          details: {
            error: "Visualization planning failed",
            fallback: "Please specify chart type and columns for visualization"
          },
          recommendedChartType: "scatter",
          configuration: {},
          alternatives: ["histogram", "bar chart"],
          reasoning: "AI visualization planning failed, using basic fallback recommendations"
        };
      }

    } catch (error) {
      console.error('❌ Visualization process failed:', error);
      
      return {
        action: "error_occurred",
        details: {
          error: "Visualization process failed",
          message: (error as Error).message
        },
        recommendedChartType: "scatter",
        configuration: {},
        alternatives: [],
        reasoning: "Unexpected error occurred during visualization process"
      };
    }
  }
}
