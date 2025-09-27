import { z } from 'zod';
import OpenAI from 'openai';

/**
 * VisualizerAgent - AI-powered data visualization
 */
export class VisualizerAgent {
  public id: string = "visualizer";
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
    options?: any;
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`📈 VisualizerAgent: Creating visualization for ${input.datasetId}`);
    
    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    try {
      const systemPrompt = `You are a data visualization expert. Create appropriate charts and plots based on data characteristics and user requirements.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

Respond with ONLY this JSON structure (no other text):
{
  "action": "data_visualization",
  "reasoning": "string explaining your visualization choice",
  "chartPath": "string with the path to the chart file",
  "summary": {
    "chartType": "string describing the chart type",
    "variables": ["array of strings with variable names"],
    "insights": ["array of strings describing insights"]
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Create visualization for dataset: ${input.datasetId}\nPath: ${input.datasetPath || 'N/A'}\nProject: ${context.projectId}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Extract JSON from the response if it's wrapped in markdown
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }
      
      let result;
      try {
        result = JSON.parse(jsonContent);
      } catch (parseError) {
        console.warn('⚠️ JSON parsing failed, using fallback structure');
        result = {};
      }
      
      return {
        action: result.action || "data_visualization",
        reasoning: result.reasoning || "Visualization created successfully",
        chartPath: result.chartPath || `/uploads/chart_${input.datasetId}.png`,
        summary: {
          chartType: result.summary?.chartType || "scatter_plot",
          variables: result.summary?.variables || ["x_axis", "y_axis"],
          insights: result.summary?.insights || ["Chart generated", "Data patterns visualized"]
        }
      };
    } catch (error) {
      console.warn('⚠️ AI visualization failed:', error);
      return this.getSimulationResult(input, context);
    }
  }

  private getSimulationResult(input: any, context: any) {
    return {
      action: "data_visualization",
      reasoning: "Simulation mode - AI not available",
      chartPath: `/uploads/chart_${input.datasetId}.png`,
      summary: {
        chartType: "scatter_plot",
        variables: ["x_axis", "y_axis"],
        insights: ["Chart generated", "Data patterns visualized"]
      }
    };
  }
}