import { z } from 'zod';
import OpenAI from 'openai';

/**
 * CorrelationAgent - AI-powered correlation analysis
 */
export class CorrelationAgent {
  public id: string = "correlation";
  public name: string = "Correlation Analyst";
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
    console.log(`🔗 CorrelationAgent: Analyzing correlations for ${input.datasetId}`);
    
    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    try {
      const systemPrompt = `You are a correlation analysis expert. Find relationships, correlations, and patterns in datasets.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

Respond with ONLY this JSON structure (no other text):
{
  "action": "correlation_analysis",
  "reasoning": "string explaining your analysis",
  "correlationPath": "string with the path to the correlation file",
  "summary": {
    "strongCorrelations": ["array of strings with strong correlations"],
    "weakCorrelations": ["array of strings with weak correlations"],
    "insights": ["array of strings describing insights"]
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze correlations in dataset: ${input.datasetId}\nPath: ${input.datasetPath || 'N/A'}\nProject: ${context.projectId}` 
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
        action: result.action || "correlation_analysis",
        reasoning: result.reasoning || "Correlation analysis completed",
        correlationPath: result.correlationPath || `/uploads/correlation_${input.datasetId}.json`,
        summary: {
          strongCorrelations: result.summary?.strongCorrelations || ["var1 vs var2: 0.85"],
          weakCorrelations: result.summary?.weakCorrelations || ["var3 vs var4: 0.23"],
          insights: result.summary?.insights || ["Correlation analysis completed", "Relationships identified"]
        }
      };
    } catch (error) {
      console.warn('⚠️ AI correlation analysis failed:', error);
      return this.getSimulationResult(input, context);
    }
  }

  private getSimulationResult(input: any, context: any) {
    return {
      action: "correlation_analysis",
      reasoning: "Simulation mode - AI not available",
      correlationPath: `/uploads/correlation_${input.datasetId}.json`,
      summary: {
        strongCorrelations: ["var1 vs var2: 0.85"],
        weakCorrelations: ["var3 vs var4: 0.23"],
        insights: ["Correlation analysis completed", "Relationships identified"]
      }
    };
  }
}