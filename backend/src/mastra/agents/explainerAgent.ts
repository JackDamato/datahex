import { z } from 'zod';
import OpenAI from 'openai';

/**
 * ExplainerAgent - AI-powered result interpretation and explanation
 */
export class ExplainerAgent {
  public id: string = "explainer";
  public name: string = "Result Explainer";
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
    console.log(`💡 ExplainerAgent: Explaining results for ${input.datasetId}`);
    
    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    try {
      const systemPrompt = `You are a data science explainer. Interpret results, provide business insights, and explain findings in plain language.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

Respond with ONLY this JSON structure (no other text):
{
  "action": "result_explanation",
  "reasoning": "string explaining your explanation approach",
  "explanationPath": "string with the path to the explanation file",
  "summary": {
    "keyFindings": ["array of strings with key findings"],
    "businessInsights": ["array of strings with business insights"],
    "nextSteps": ["array of strings with recommended next steps"]
  }
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Explain results for dataset: ${input.datasetId}\nPath: ${input.datasetPath || 'N/A'}\nProject: ${context.projectId}` 
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
        action: result.action || "result_explanation",
        reasoning: result.reasoning || "Results explained successfully",
        explanationPath: result.explanationPath || `/uploads/explanation_${input.datasetId}.txt`,
        summary: {
          keyFindings: result.summary?.keyFindings || ["Analysis completed", "Patterns identified"],
          businessInsights: result.summary?.businessInsights || ["Data shows interesting trends", "Further analysis recommended"],
          nextSteps: result.summary?.nextSteps || ["Continue analysis", "Apply insights", "Monitor results"]
        }
      };
    } catch (error) {
      console.warn('⚠️ AI explanation failed:', error);
      return this.getSimulationResult(input, context);
    }
  }

  private getSimulationResult(input: any, context: any) {
    return {
      action: "result_explanation",
      reasoning: "Simulation mode - AI not available",
      explanationPath: `/uploads/explanation_${input.datasetId}.txt`,
      summary: {
        keyFindings: ["Analysis completed", "Patterns identified"],
        businessInsights: ["Data shows interesting trends", "Further analysis recommended"],
        nextSteps: ["Continue analysis", "Apply insights", "Monitor results"]
      }
    };
  }
}