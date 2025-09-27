import { z } from 'zod';
import { Agent } from '@mastra/core/agent';

/**
 * AnalystAgent - Statistical analysis and data insights
 * Performs descriptive statistics, hypothesis tests, and data summaries
 */
export class AnalystAgent extends Agent {
  constructor() {
    super({
      id: "analyst",
      name: "Data Analyst",
      instructions: `You are a Data Analyst Agent specializing in statistical analysis and data insights.

Your capabilities include:
- Descriptive statistics (mean, median, mode, standard deviation, variance)
- Data distribution analysis
- Hypothesis testing
- Correlation analysis
- Data quality assessment
- Statistical summaries and reports

When analyzing data, provide:
1. Comprehensive statistical summaries
2. Distribution analysis
3. Outlier detection and analysis
4. Data quality insights
5. Actionable recommendations based on findings

Always provide clear explanations and statistical context for your findings.`,
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
    analysisType?: 'descriptive' | 'distribution' | 'quality' | 'comprehensive';
    columns?: string[];
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`📊 AnalystAgent: Starting statistical analysis for dataset ${input.datasetId}`);
    console.log(`📋 Analysis type: ${input.analysisType || 'comprehensive'}`);

    try {
      // Build comprehensive context for AI analysis
      const systemPrompt = `${this.instructions}

Your role is to:
1. Analyze the dataset to understand its statistical properties
2. Provide comprehensive statistical summaries
3. Identify patterns, trends, and anomalies
4. Generate actionable insights and recommendations

Think step by step and provide detailed statistical analysis.`;

      const userPrompt = `Dataset to analyze: ${input.datasetId}
${input.datasetPath ? `Path: ${input.datasetPath}` : ''}
Project: ${context.projectId}

Analysis Requirements:
- Type: ${input.analysisType || 'comprehensive'}
- Columns: ${input.columns ? input.columns.join(', ') : 'All columns'}

Please provide:
1. Descriptive statistics summary
2. Data distribution analysis
3. Data quality assessment
4. Key insights and patterns
5. Recommendations for further analysis

Provide realistic estimates and detailed statistical explanations.`;

      // Use Mastra's AI for statistical analysis
      console.log('🤖 Starting AI-powered statistical analysis...');
      
      try {
        const response = await this.generate([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        {
          temperature: 0.7,
          maxSteps: 3,
          providerOptions: {
            openai: {
              model: "gpt-4o-mini",  // Specify the model here
              reasoningEffort: "high"
            }
          },
        }
      );
        
        const result = JSON.parse(response.text || '{}');
        console.log(`✅ Analysis Result: ${result.action}`);
        console.log(`💡 Insights: ${result.insights?.length || 0} found`);
        
        return result;
        
      } catch (aiError) {
        console.warn('⚠️ AI analysis failed:', (aiError as Error).message);
        
        return {
          action: "error_occurred",
          details: {
            error: "Statistical analysis failed",
            fallback: "Please try again or provide more specific analysis requirements"
          },
          insights: ["Analysis temporarily unavailable"],
          recommendations: ["Retry analysis with specific parameters"],
          reasoning: "AI analysis failed, unable to provide statistical insights"
        };
      }

    } catch (error) {
      console.error('❌ Analysis process failed:', error);
      
      return {
        action: "error_occurred",
        details: {
          error: "Analysis process failed",
          message: (error as Error).message
        },
        insights: [],
        recommendations: [],
        reasoning: "Unexpected error occurred during analysis process"
      };
    }
  }
}
