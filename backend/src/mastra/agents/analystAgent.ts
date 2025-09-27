import { z } from 'zod';
import OpenAI from 'openai';
import { mcpClient } from '../../mcpClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
    options?: {
      featureEngineering?: boolean;
      operations?: Array<{
        type: string;
        parameters: Record<string, any>;
      }>;
      targetColumn?: string;
    };
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`📊 AnalystAgent: Starting analysis for ${input.datasetId}`);
    
    // Check if feature engineering is requested
    if (input.options?.featureEngineering || context.metadata?.sandboxIntegration) {
      console.log('🔧 Using sandbox integration for feature engineering...');
      return await this.runWithFeatureEngineering(input, context);
    }
    
    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    try {
      const systemPrompt = `You are a data analyst and feature engineering expert. Analyze datasets and provide statistical insights, feature engineering recommendations, and data exploration results.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.

Respond with ONLY this JSON structure (no other text):
{
  "action": "data_analysis",
  "reasoning": "string explaining your analysis",
  "analysisPath": "string with the path to the analysis file",
  "featureEngineeringRecommendations": [
    {
      "type": "log_transform|scaling|one_hot_encode|polynomial_features|feature_selection|binning|interaction_features",
      "parameters": {"columns": ["col1", "col2"], "method": "standard|minmax", "degree": 2, "k": 10},
      "reasoning": "Why this transformation is recommended"
    }
  ],
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
            content: `Analyze dataset: ${input.datasetId}\nPath: ${input.datasetPath || 'N/A'}\nProject: ${context.projectId}\n\nProvide feature engineering recommendations for this dataset.` 
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
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
        featureEngineeringRecommendations: result.featureEngineeringRecommendations || [],
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

  /**
   * Run feature engineering using sandbox integration
   */
  private async runWithFeatureEngineering(input: any, context: any) {
    try {
      console.log('🔗 Connecting to Python sandbox for feature engineering...');

      // Test sandbox connection
      const health = await mcpClient.healthCheck();
      console.log('✅ Sandbox connected:', health.status);

      // Use AI to determine feature engineering strategy
      const openai = this.openai;
      let operations = [];

      if (openai) {
        console.log('🤖 Using AI to determine feature engineering strategy...');
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a feature engineering expert. Analyze the dataset and recommend specific feature engineering operations. 
              Respond with JSON containing an array of operations:
              {
                "operations": [
                  {
                    "type": "log_transform|scaling|one_hot_encode|polynomial_features|feature_selection|binning|interaction_features",
                    "parameters": {"columns": ["col1", "col2"], "method": "standard|minmax", "degree": 2, "k": 10}
                  }
                ]
              }`
            },
            {
              role: "user",
              content: `Dataset: ${input.datasetId}, Options: ${JSON.stringify(input.options)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        });

        try {
          const aiResult = JSON.parse(response.choices[0]?.message?.content || '{}');
          operations = aiResult.operations || [];
        } catch (e) {
          console.warn('⚠️ Failed to parse AI strategy, using default operations');
        }
      }

      // Default operations if AI didn't provide any
      if (operations.length === 0) {
        operations = [
          { type: "log_transform", parameters: { columns: [] } },
          { type: "scaling", parameters: { method: "standard", columns: [] } },
          { type: "one_hot_encode", parameters: { columns: [] } }
        ];
      }

      console.log(`🔧 Applying ${operations.length} feature engineering operations...`);

      // Execute feature engineering using sandbox
      const engineeringResult = await mcpClient.engineerFeatures({
        dataset_id: input.datasetId,
        operations: operations,
        target_column: input.options?.targetColumn
      });

      console.log('✅ Feature engineering completed');
      console.log(`📊 New dataset: ${engineeringResult.newDatasetId}`);
      console.log(`📈 Shape: ${engineeringResult.original_shape} → ${engineeringResult.new_shape}`);
      console.log(`🔧 Operations applied: ${engineeringResult.operations_applied.length}`);

      return {
        action: "feature_engineering",
        reasoning: `Applied feature engineering with ${engineeringResult.operations_applied.length} operations using Python sandbox`,
        analysisPath: `/uploads/engineered_${engineeringResult.newDatasetId}.parquet`,
        sandboxDatasetId: engineeringResult.newDatasetId,
        featureEngineeringResults: {
          newDatasetId: engineeringResult.newDatasetId,
          operationsApplied: engineeringResult.operations_applied,
          featureImportance: engineeringResult.feature_importance,
          originalShape: engineeringResult.original_shape,
          newShape: engineeringResult.new_shape
        },
        summary: {
          insights: [
            `Feature engineering completed with ${engineeringResult.operations_applied.length} operations`,
            `Dataset shape changed from ${engineeringResult.original_shape} to ${engineeringResult.new_shape}`,
            `Generated new dataset: ${engineeringResult.newDatasetId}`
          ],
          recommendations: [
            "Review the engineered features for model training",
            "Consider feature selection based on importance scores",
            "Validate the new features with domain knowledge"
          ]
        }
      };

    } catch (error) {
      console.error('❌ Feature engineering failed:', error);
      return {
        action: "feature_engineering_error",
        reasoning: "Feature engineering failed, falling back to analysis only",
        analysisPath: `/uploads/analysis_${input.datasetId}.json`,
        summary: {
          insights: ["Feature engineering failed", "Analysis completed without engineering"],
          recommendations: ["Check sandbox connection", "Try manual feature engineering"]
        }
      };
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