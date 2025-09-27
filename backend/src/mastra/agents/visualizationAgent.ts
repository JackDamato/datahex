import { z } from 'zod';
import OpenAI from 'openai';
import { mcpClient } from '../../mcpClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * VisualizationAgent - AI-powered chart generation with Python sandbox integration
 */
export class VisualizationAgent {
  public id: string = "visualization";
  public name: string = "Data Visualizer";
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async run(input: { 
    datasetId: string;
    datasetPath?: string;
    options?: {
      chartType?: string;
      columns?: string[];
      chartOptions?: Record<string, any>;
      useSandbox?: boolean;
    };
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`📊 VisualizationAgent: Generating chart for ${input.datasetId}`);
    console.log(`📈 Project: ${context.projectId}, Dataset: ${context.datasetId}`);
    console.log(`⚙️ Options:`, input.options);

    // Check if sandbox integration is requested
    if (input.options?.useSandbox || context.metadata?.sandboxIntegration) {
      console.log('📊 Using sandbox integration for visualization...');
      return await this.runWithSandbox(input, context);
    }

    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    // Use OpenAI to determine best chart type if not specified
    let chartType = input.options?.chartType;
    if (!chartType) {
      chartType = await this.determineChartType(input, context);
    }

    // Generate chart using OpenAI
    const chartPrompt = this.buildChartPrompt(input, chartType);
    
    try {
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a data visualization expert. Generate Plotly chart specifications in JSON format. Return only valid JSON that can be parsed directly."
          },
          {
            role: "user",
            content: chartPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const chartSpec = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        action: "chart_generation",
        reasoning: `Generated ${chartType} chart for columns: ${input.options?.columns?.join(', ') || 'all'}`,
        chartPath: `/uploads/chart_${input.datasetId}_${Date.now()}.json`,
        chartSpec: chartSpec,
        chartType: chartType,
        summary: {
          chartType: chartType,
          columns: input.options?.columns || [],
          description: `Generated ${chartType} visualization`
        }
      };

    } catch (error) {
      console.error('❌ OpenAI chart generation failed:', error);
      return this.getSimulationResult(input, context);
    }
  }

  /**
   * Run visualization using sandbox integration
   */
  private async runWithSandbox(input: any, context: any) {
    try {
      console.log('📊 Connecting to Python sandbox for visualization...');

      // Test sandbox connection
      const health = await mcpClient.healthCheck();
      console.log('✅ Sandbox connected:', health.status);

      // Determine chart type if not specified
      let chartType = input.options?.chartType;
      if (!chartType) {
        chartType = await this.determineChartType(input, context);
      }

      // Get chart recommendations first
      const recommendations = await mcpClient.getChartRecommendations({
        dataset_id: input.datasetId,
        columns: input.options?.columns || []
      });

      console.log('📊 Chart recommendations:', recommendations.recommendations.length);

      // Generate the chart
      const chartResult = await mcpClient.generateVisualization({
        dataset_id: input.datasetId,
        chart_type: chartType,
        columns: input.options?.columns || [],
        options: input.options?.chartOptions
      });

      console.log('✅ Sandbox visualization completed');
      console.log(`📊 Chart type: ${chartResult.chart_type}`);
      console.log(`📈 Columns used: ${chartResult.columns_used.join(', ')}`);
      console.log(`🖼️ PNG preview generated: ${chartResult.png_preview ? 'Yes' : 'No'}`);

      // Generate AI-powered description using OpenAI
      let aiDescription = null;
      if (this.openai) {
        console.log('🤖 Generating AI-powered chart description...');
        try {
          const descriptionResponse = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a data analyst. Describe the chart and its insights in a clear, actionable way. Focus on what the visualization reveals about the data."
              },
              {
                role: "user",
                content: `Chart Analysis:
                - Type: ${chartResult.chart_type}
                - Columns: ${chartResult.columns_used.join(', ')}
                - Dataset shape: ${chartResult.metadata.dataset_shape[0]} rows × ${chartResult.metadata.dataset_shape[1]} columns
                
                Please provide a concise description of what this chart shows and any key insights.`
              }
            ],
            temperature: 0.7,
            max_tokens: 300
          });

          aiDescription = descriptionResponse.choices[0]?.message?.content || null;
        } catch (error) {
          console.warn('⚠️ AI description generation failed:', error);
        }
      }

      return {
        action: "sandbox_visualization",
        reasoning: `Used Python sandbox to generate ${chartResult.chart_type} chart with ${chartResult.columns_used.length} columns`,
        chartPath: `/uploads/chart_${input.datasetId}_${Date.now()}.json`,
        sandboxAnalysisId: chartResult.metadata.generated_at,
        chartResult: {
          chartType: chartResult.chart_type,
          columnsUsed: chartResult.columns_used,
          plotlyJson: chartResult.plotly_json,
          pngPreview: chartResult.png_preview,
          metadata: chartResult.metadata
        },
        recommendations: recommendations.recommendations,
        summary: {
          chartType: chartResult.chart_type,
          columns: chartResult.columns_used,
          description: aiDescription || `Generated ${chartResult.chart_type} visualization`,
          insights: [
            `Chart shows relationship between ${chartResult.columns_used.join(' and ')}`,
            `Dataset contains ${chartResult.metadata.dataset_shape[0]} data points`,
            `Visualization ready for interactive exploration`
          ]
        }
      };

    } catch (error: any) {
      console.error('❌ Sandbox visualization failed:', error);
      return {
        action: "sandbox_error",
        reasoning: "Sandbox integration failed, falling back to simulation",
        chartPath: `/uploads/chart_${input.datasetId}_${Date.now()}.json`,
        summary: {
          chartType: input.options?.chartType || 'histogram',
          columns: input.options?.columns || [],
          description: "Visualization failed - check sandbox connection",
          insights: ["Chart generation failed", "Check sandbox connection"]
        }
      };
    }
  }

  /**
   * Determine the best chart type using AI
   */
  private async determineChartType(input: any, context: any): Promise<string> {
    if (!this.openai) {
      return 'histogram'; // Default fallback
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a data visualization expert. Based on the dataset information, recommend the best chart type. Respond with only one of: histogram, scatter, line, bar, heatmap, box, violin, correlation, pairplot, distribution"
          },
          {
            role: "user",
            content: `Dataset: ${input.datasetId}
            Columns: ${input.options?.columns?.join(', ') || 'Not specified'}
            Prior actions: ${context.priorActions.join(', ') || 'None'}
            
            What chart type would best visualize this data?`
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      });

      const chartType = response.choices[0]?.message?.content?.trim().toLowerCase() || 'histogram';
      const validTypes = ['histogram', 'scatter', 'line', 'bar', 'heatmap', 'box', 'violin', 'correlation', 'pairplot', 'distribution'];
      
      return validTypes.includes(chartType) ? chartType : 'histogram';
    } catch (error) {
      console.warn('⚠️ Chart type determination failed:', error);
      return 'histogram';
    }
  }

  /**
   * Build chart generation prompt
   */
  private buildChartPrompt(input: any, chartType: string): string {
    return `Generate a ${chartType} chart for dataset ${input.datasetId}.
    
    Columns to visualize: ${input.options?.columns?.join(', ') || 'All available columns'}
    Chart type: ${chartType}
    
    Create a Plotly chart specification that:
    1. Uses appropriate data mappings for ${chartType}
    2. Includes proper titles and labels
    3. Has good color schemes and styling
    4. Is interactive and user-friendly
    
    Return only the Plotly JSON specification.`;
  }

  /**
   * Get simulation result when AI is not available
   */
  private getSimulationResult(input: any, context: any) {
    return {
      action: "chart_generation",
      reasoning: "Simulation mode - AI not available",
      chartPath: `/uploads/chart_${input.datasetId}_${Date.now()}.json`,
      chartType: input.options?.chartType || 'histogram',
      summary: {
        chartType: input.options?.chartType || 'histogram',
        columns: input.options?.columns || [],
        description: "Chart generated in simulation mode"
      }
    };
  }
}
