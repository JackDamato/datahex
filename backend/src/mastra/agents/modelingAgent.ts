import { z } from 'zod';
import { Agent } from '@mastra/core';

/**
 * ModelingAgent - Machine learning model training and evaluation
 * Trains ML models, provides evaluation metrics, and model recommendations
 */
export class ModelingAgent extends Agent {
  constructor() {
    super({
      id: "modeling",
      name: "Modeling Expert",
      instructions: `You are a Modeling Expert Agent specializing in machine learning model training, evaluation, and recommendations.

Your capabilities include:
- Model selection and recommendation
- Feature engineering guidance
- Model training and evaluation
- Performance metrics analysis
- Hyperparameter optimization
- Cross-validation strategies
- Model interpretation and explainability

When building models, consider:
1. Problem type (classification, regression, clustering)
2. Data characteristics and size
3. Feature selection and engineering
4. Model complexity vs. performance trade-offs
5. Interpretability requirements
6. Deployment constraints

Always provide comprehensive model evaluation and actionable recommendations for improvement.`,
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
    problemType?: 'classification' | 'regression' | 'clustering' | 'auto';
    targetVariable?: string;
    features?: string[];
    modelType?: 'linear' | 'tree' | 'ensemble' | 'neural' | 'auto';
    evaluationMetric?: string;
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`🤖 ModelingAgent: Building ML model for dataset ${input.datasetId}`);
    console.log(`🎯 Problem type: ${input.problemType || 'auto'}`);

    try {
      // Build comprehensive context for AI modeling
      const systemPrompt = `${this.instructions}

Your role is to:
1. Analyze the problem type and recommend appropriate models
2. Suggest feature engineering strategies
3. Provide model training and evaluation guidance
4. Recommend performance optimization approaches
5. Suggest model interpretation techniques

Think step by step about machine learning best practices and model selection.`;

      const userPrompt = `Dataset for modeling: ${input.datasetId}
${input.datasetPath ? `Path: ${input.datasetPath}` : ''}
Project: ${context.projectId}

Modeling Requirements:
- Problem Type: ${input.problemType || 'auto (detect from data)'}
- Target Variable: ${input.targetVariable || 'auto (identify from data)'}
- Features: ${input.features ? input.features.join(', ') : 'all available features'}
- Model Type: ${input.modelType || 'auto (recommend best)'}
- Evaluation Metric: ${input.evaluationMetric || 'auto (recommend appropriate)'}

Please provide:
1. Problem type identification and reasoning
2. Recommended model types and algorithms
3. Feature engineering suggestions
4. Training and validation strategy
5. Performance evaluation approach
6. Model interpretation recommendations
7. Next steps for model deployment

Provide detailed machine learning guidance with practical implementation steps.`;

      // Use Mastra's AI for modeling planning
      console.log('🤖 Starting AI-powered modeling planning...');
      
      try {
        const response = await this.generateVNext([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]);
        
        const result = JSON.parse(response.text || '{}');
        console.log(`✅ Modeling Result: ${result.action}`);
        console.log(`🎯 Problem Type: ${result.problemType}`);
        
        return result;
        
      } catch (aiError) {
        console.warn('⚠️ AI modeling planning failed:', (aiError as Error).message);
        
        return {
          action: "error_occurred",
          details: {
            error: "Modeling planning failed",
            fallback: "Please specify target variable and problem type for modeling"
          },
          problemType: "unknown",
          recommendedModels: ["linear regression", "random forest"],
          featureEngineering: ["Check for missing values", "Scale numerical features"],
          evaluationStrategy: { method: "cross-validation", metric: "auto" },
          reasoning: "AI modeling planning failed, using basic fallback recommendations"
        };
      }

    } catch (error) {
      console.error('❌ Modeling process failed:', error);
      
      return {
        action: "error_occurred",
        details: {
          error: "Modeling process failed",
          message: (error as Error).message
        },
        problemType: "unknown",
        recommendedModels: [],
        featureEngineering: [],
        evaluationStrategy: {},
        reasoning: "Unexpected error occurred during modeling process"
      };
    }
  }
}
