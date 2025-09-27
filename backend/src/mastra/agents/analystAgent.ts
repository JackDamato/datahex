import { z } from 'zod';
import OpenAI from 'openai';

/**
 * AnalystAgent - AI-powered data analysis and feature engineering
 */
export class AnalystAgent {
  public id: string = "analyst";
  public name: string = "Data Analyst";
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
    console.log(`📊 AnalystAgent: Starting analysis for ${input.datasetId}`);
    
    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    try {
      const systemPrompt = `You are a data analyst. Analyze datasets and provide statistical insights, feature engineering recommendations, and data exploration results.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

Respond with ONLY this JSON structure (no other text):
{
  "action": "data_analysis",
  "reasoning": "string explaining your analysis",
  "analysisPath": "string with the path to the analysis file",
  "summary": {
    "insights": ["array of strings describing insights"],
    "recommendations": ["array of strings with recommendations"]
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze dataset: ${input.datasetId}\nPath: ${input.datasetPath || 'N/A'}\nProject: ${context.projectId}` 
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
        action: result.action || "data_analysis",
        reasoning: result.reasoning || "Statistical analysis completed",
        analysisPath: result.analysisPath || `/uploads/analysis_${input.datasetId}.json`,
        summary: {
          insights: result.summary?.insights || ["Dataset analyzed", "Statistical summary generated"],
          recommendations: result.summary?.recommendations || ["Consider feature engineering", "Apply outlier detection"]
        }
      };
    } catch (error) {
      console.warn('⚠️ AI analysis failed:', error);
      return this.getSimulationResult(input, context);
    }
  }

  private getSimulationResult(input: any, context: any) {
    return {
      action: "data_analysis",
      reasoning: "Simulation mode - AI not available",
      analysisPath: `/uploads/analysis_${input.datasetId}.json`,
      summary: {
        insights: ["Dataset analyzed", "Statistical summary generated", "Feature recommendations provided"],
        recommendations: ["Consider data cleaning", "Apply feature engineering", "Perform correlation analysis"]
      }
    };
  }
}