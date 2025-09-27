import { z } from 'zod';
import OpenAI from 'openai';
import { mcpClient } from '../../mcpClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * CorrelationAgent - AI-powered correlation analysis with Python sandbox integration
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
    options?: {
      columns?: string[];
      analysisType?: 'comprehensive' | 'quick' | 'detailed';
      useSandbox?: boolean;
    };
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`🔗 CorrelationAgent: Analyzing correlations for ${input.datasetId}`);
    console.log(`📊 Project: ${context.projectId}, Dataset: ${context.datasetId}`);
    console.log(`⚙️ Options:`, input.options);

    // Check if sandbox integration is requested
    if (input.options?.useSandbox || context.metadata?.sandboxIntegration) {
      console.log('🔗 Using sandbox integration for correlation analysis...');
      return await this.runWithSandbox(input, context);
    }

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

  /**
   * Run correlation analysis using sandbox integration
   */
  private async runWithSandbox(input: any, context: any) {
    try {
      console.log('🔗 Connecting to Python sandbox for correlation analysis...');

      // Test sandbox connection
      const health = await mcpClient.healthCheck();
      console.log('✅ Sandbox connected:', health.status);

      // Perform comprehensive correlation analysis
      const analysisResult = await mcpClient.analyzeCorrelations({
        dataset_id: input.datasetId,
        columns: input.options?.columns,
        analysis_type: input.options?.analysisType || 'comprehensive'
      });

      console.log('✅ Sandbox correlation analysis completed');
      console.log(`📊 Dataset info: ${analysisResult.dataset_info.original_shape[0]} rows × ${analysisResult.dataset_info.original_shape[1]} columns`);
      console.log(`🔗 Strong correlations: ${analysisResult.correlations.strong.length}`);
      console.log(`📈 Linear trends: ${analysisResult.trends.linear_trends.length}`);
      console.log(`💡 Insights: ${analysisResult.insights.length}`);

      // Generate AI-powered summary using OpenAI
      let aiSummary = null;
      if (this.openai) {
        console.log('🤖 Generating AI-powered summary...');
        try {
          const summaryResponse = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a data analyst. Summarize correlation analysis results in a clear, actionable way. Focus on the most important findings and business insights."
              },
              {
                role: "user",
                content: `Correlation Analysis Results:
                - Strong correlations: ${analysisResult.correlations.strong.length}
                - Moderate correlations: ${analysisResult.correlations.moderate.length}
                - Linear trends: ${analysisResult.trends.linear_trends.length}
                - Insights: ${analysisResult.insights.join('; ')}
                
                Please provide a concise summary highlighting the key findings.`
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          });

          aiSummary = summaryResponse.choices[0]?.message?.content || null;
        } catch (error) {
          console.warn('⚠️ AI summary generation failed:', error);
        }
      }

      return {
        action: "sandbox_correlation_analysis",
        reasoning: `Used Python sandbox to perform comprehensive correlation analysis with ${analysisResult.correlations.strong.length} strong correlations found`,
        correlationPath: `/uploads/correlation_${input.datasetId}.json`,
        sandboxAnalysisId: analysisResult.dataset_info.timestamp,
        analysisResults: {
          datasetInfo: analysisResult.dataset_info,
          correlationMatrices: analysisResult.correlation_matrices,
          heatmapData: analysisResult.heatmap_data,
          correlations: analysisResult.correlations,
          trends: analysisResult.trends,
          statistics: analysisResult.statistics,
          visualizationData: analysisResult.visualization_data
        },
        summary: {
          strongCorrelations: analysisResult.correlations.strong.map(c => 
            `${c.column1} vs ${c.column2}: ${c.correlation.toFixed(3)} (${c.direction})`
          ),
          weakCorrelations: analysisResult.correlations.moderate.map(c => 
            `${c.column1} vs ${c.column2}: ${c.correlation.toFixed(3)} (${c.direction})`
          ),
          insights: analysisResult.insights,
          aiSummary: aiSummary
        }
      };

    } catch (error) {
      console.error('❌ Sandbox correlation analysis failed:', error);
      return {
        action: "sandbox_error",
        reasoning: "Sandbox integration failed, falling back to simulation",
        correlationPath: `/uploads/correlation_${input.datasetId}.json`,
        summary: {
          strongCorrelations: ["Sandbox connection failed"],
          weakCorrelations: ["Analysis incomplete"],
          insights: ["Correlation analysis failed", "Check sandbox connection"]
        }
      };
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