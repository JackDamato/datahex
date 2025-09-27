import { z } from 'zod';
import { Agent } from '@mastra/core/agent';

/**
 * ExplainerAgent - Result interpretation and insights generation
 * Summarizes results for non-technical stakeholders and provides actionable insights
 */
export class ExplainerAgent extends Agent {
  constructor() {
    super({
      id: "explainer",
      name: "Explainer",
      instructions: `You are an Explainer Agent specializing in interpreting results and generating actionable insights for non-technical stakeholders.

Your capabilities include:
- Technical result interpretation
- Business insight generation
- Storytelling with data
- Executive summary creation
- Actionable recommendation formulation
- Risk assessment and mitigation
- Stakeholder communication

When explaining results, focus on:
1. Clear, jargon-free explanations
2. Business impact and implications
3. Actionable next steps
4. Risk assessment and mitigation
5. Visual storytelling recommendations
6. Stakeholder-specific messaging

Always translate technical findings into business value and actionable insights.`,
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
    analysisResults?: any;
    stakeholderType?: 'executive' | 'technical' | 'business' | 'general';
    focusArea?: string;
    previousInsights?: string[];
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`💡 ExplainerAgent: Generating insights for dataset ${input.datasetId}`);
    console.log(`👥 Stakeholder type: ${input.stakeholderType || 'general'}`);

    try {
      // Build comprehensive context for AI explanation
      const systemPrompt = `${this.instructions}

Your role is to:
1. Interpret technical analysis results
2. Generate business insights and implications
3. Create actionable recommendations
4. Assess risks and opportunities
5. Provide stakeholder-appropriate explanations

Think step by step about business value and practical implications.`;

      const userPrompt = `Dataset to explain: ${input.datasetId}
${input.datasetPath ? `Path: ${input.datasetPath}` : ''}
Project: ${context.projectId}

Explanation Requirements:
- Stakeholder Type: ${input.stakeholderType || 'general audience'}
- Focus Area: ${input.focusArea || 'comprehensive analysis'}
- Previous Insights: ${input.previousInsights ? input.previousInsights.join(', ') : 'none'}

${input.analysisResults ? `
Analysis Results to Interpret:
${JSON.stringify(input.analysisResults, null, 2)}
` : 'No specific analysis results provided - generate general insights'}

Please provide:
1. Executive summary of findings
2. Key business insights and implications
3. Actionable recommendations
4. Risk assessment and mitigation strategies
5. Success metrics and KPIs
6. Next steps and timeline recommendations
7. Stakeholder communication strategy

Provide clear, actionable insights that drive business value.`;

      // Use Mastra's AI for insight generation
      console.log('🤖 Starting AI-powered insight generation...');
      
      try {
        const response = await this.generate([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]);
        
        const result = JSON.parse(response.text || '{}');
        console.log(`✅ Insight Generation Result: ${result.action}`);
        console.log(`💡 Key Insights: ${result.keyInsights?.length || 0} generated`);
        
        return result;
        
      } catch (aiError) {
        console.warn('⚠️ AI insight generation failed:', (aiError as Error).message);
        
        return {
          action: "error_occurred",
          details: {
            error: "Insight generation failed",
            fallback: "Please provide analysis results for interpretation"
          },
          executiveSummary: "Analysis results are temporarily unavailable for interpretation.",
          keyInsights: ["Data analysis completed", "Further interpretation needed"],
          recommendations: ["Review analysis results", "Provide specific insights for interpretation"],
          risksAndOpportunities: { risks: [], opportunities: [] },
          nextSteps: ["Retry insight generation", "Provide analysis context"],
          reasoning: "AI insight generation failed, unable to interpret results"
        };
      }

    } catch (error) {
      console.error('❌ Insight generation process failed:', error);
      
      return {
        action: "error_occurred",
        details: {
          error: "Insight generation process failed",
          message: (error as Error).message
        },
        executiveSummary: "Error occurred during insight generation.",
        keyInsights: [],
        recommendations: [],
        risksAndOpportunities: { risks: [], opportunities: [] },
        nextSteps: [],
        reasoning: "Unexpected error occurred during insight generation process"
      };
    }
  }
}
