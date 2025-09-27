import { z } from 'zod';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * ExplainerAgent - AI-powered explanation and reasoning agent
 * 
 * This agent summarizes what happened in the data analysis pipeline,
 * explains decisions made by other agents, and provides interactive
 * explanations via chat functionality.
 */
export class ExplainerAgent {
  public id: string = "explainer";
  public name: string = "Data Explainer";
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async run(input: { 
    action: 'explain' | 'summarize' | 'answer_question';
    context?: {
      agentActions?: Array<{
        agent: string;
        action: string;
        reasoning: string;
        timestamp: string;
        result?: any;
      }>;
      userQuestion?: string;
      datasetInfo?: {
        name: string;
        rows: number;
        columns: number;
        columns_info?: Array<{
          name: string;
          type: string;
          null_count: number;
          unique_count: number;
        }>;
      };
      modelResults?: Array<{
        algorithm: string;
        accuracy?: number;
        r2_score?: number;
        features_used: string[];
        feature_importance: Record<string, number>;
      }>;
      visualizationResults?: Array<{
        chart_type: string;
        columns_used: string[];
        insights?: string[];
      }>;
    };
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`🤖 ExplainerAgent: ${input.action} for project ${context.projectId}`);
    console.log(`📊 Dataset: ${context.datasetId}`);
    console.log(`⚙️ Context:`, input.context);

    if (!this.openai) {
      return this.getSimulationResult(input, context);
    }

    try {
      let explanation = '';

      switch (input.action) {
        case 'explain':
          explanation = await this.explainAgentActions(input.context, context);
          break;
        case 'summarize':
          explanation = await this.summarizeAnalysis(input.context, context);
          break;
        case 'answer_question':
          explanation = await this.answerUserQuestion(input.context, context);
          break;
        default:
          explanation = 'Unknown action requested.';
      }

      return {
        action: "explanation_generated",
        reasoning: `Generated ${input.action} explanation using AI`,
        explanation: explanation,
        summary: {
          type: input.action,
          explanation: explanation,
          timestamp: new Date().toISOString(),
          agent: 'explainer'
        }
      };

    } catch (error) {
      console.error('❌ ExplainerAgent failed:', error);
      return this.getSimulationResult(input, context);
    }
  }

  /**
   * Explain agent actions and decisions
   */
  private async explainAgentActions(context: any, projectContext: any): Promise<string> {
    if (!context?.agentActions || context.agentActions.length === 0) {
      return "No agent actions to explain yet. Start by running some data analysis operations.";
    }

    const agentActionsText = context.agentActions.map((action: any, index: number) => 
      `${index + 1}. **${action.agent}** (${new Date(action.timestamp).toLocaleString()}):\n` +
      `   - Action: ${action.action}\n` +
      `   - Reasoning: ${action.reasoning}\n` +
      `   - Result: ${action.result ? JSON.stringify(action.result).substring(0, 200) + '...' : 'N/A'}`
    ).join('\n\n');

    const prompt = `You are a data science expert explaining the analysis pipeline. 

    Here's what happened in this data analysis session:

    ${agentActionsText}

    Dataset Info:
    - Name: ${context.datasetInfo?.name || 'Unknown'}
    - Rows: ${context.datasetInfo?.rows || 'Unknown'}
    - Columns: ${context.datasetInfo?.columns || 'Unknown'}

    Please provide a clear, comprehensive explanation of:
    1. What each agent did and why
    2. The logical flow of the analysis
    3. Key insights discovered
    4. Any potential issues or recommendations

    Write in a conversational, educational tone that helps users understand the data science process.`;

    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful data science expert who explains complex analysis workflows in simple, clear terms. Focus on helping users understand what happened and why."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0]?.message?.content || "Unable to generate explanation.";
  }

  /**
   * Summarize the entire analysis
   */
  private async summarizeAnalysis(context: any, projectContext: any): Promise<string> {
    const prompt = `You are summarizing a data analysis session. Here's what happened:

    Dataset: ${context.datasetInfo?.name || 'Unknown'} (${context.datasetInfo?.rows || 0} rows, ${context.datasetInfo?.columns || 0} columns)

    Agent Actions: ${context.agentActions?.length || 0} actions performed

    Model Results: ${context.modelResults?.length || 0} models trained
    ${context.modelResults?.map((model: any) => 
      `- ${model.algorithm}: ${model.accuracy ? (model.accuracy * 100).toFixed(1) + '% accuracy' : (model.r2_score * 100).toFixed(1) + '% R² score'}`
    ).join('\n') || ''}

    Visualizations: ${context.visualizationResults?.length || 0} charts created
    ${context.visualizationResults?.map((viz: any) => 
      `- ${viz.chart_type}: ${viz.columns_used.join(', ')}`
    ).join('\n') || ''}

    Please provide a comprehensive summary that includes:
    1. Overview of the dataset and analysis goals
    2. Key findings and insights
    3. Model performance highlights
    4. Visualizations created and their purpose
    5. Overall assessment and next steps

    Write in a professional, executive summary style.`;

    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior data scientist creating executive summaries of data analysis projects. Be concise but comprehensive."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 800
    });

    return response.choices[0]?.message?.content || "Unable to generate summary.";
  }

  /**
   * Answer user questions about the analysis
   */
  private async answerUserQuestion(context: any, projectContext: any): Promise<string> {
    if (!context?.userQuestion) {
      return "No question provided. Please ask a specific question about the analysis.";
    }

    const question = context.userQuestion;
    
    // Build context about the analysis
    const analysisContext = this.buildAnalysisContext(context);
    
    const prompt = `You are a helpful data science expert answering questions about a data analysis session.

    Analysis Context:
    ${analysisContext}

    User Question: "${question}"

    Please provide a clear, helpful answer that:
    1. Directly addresses the user's question
    2. References specific findings from the analysis when relevant
    3. Explains technical concepts in accessible terms
    4. Suggests follow-up actions if appropriate

    If the question is about something not covered in the analysis, explain what would be needed to answer it.`;

    const response = await this.openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful data science expert who answers questions about data analysis in a clear, educational way. Always be honest about what you know and don't know."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    return response.choices[0]?.message?.content || "Unable to generate answer.";
  }

  /**
   * Build analysis context for answering questions
   */
  private buildAnalysisContext(context: any): string {
    let contextText = '';

    // Dataset info
    if (context.datasetInfo) {
      contextText += `Dataset: ${context.datasetInfo.name} (${context.datasetInfo.rows} rows, ${context.datasetInfo.columns} columns)\n`;
      if (context.datasetInfo.columns_info) {
        contextText += 'Column Information:\n';
        context.datasetInfo.columns_info.forEach((col: any) => {
          contextText += `- ${col.name}: ${col.type} (${col.null_count} nulls, ${col.unique_count} unique values)\n`;
        });
      }
    }

    // Agent actions
    if (context.agentActions && context.agentActions.length > 0) {
      contextText += '\nAgent Actions Performed:\n';
      context.agentActions.forEach((action: any, index: number) => {
        contextText += `${index + 1}. ${action.agent}: ${action.action}\n`;
        contextText += `   Reasoning: ${action.reasoning}\n`;
      });
    }

    // Model results
    if (context.modelResults && context.modelResults.length > 0) {
      contextText += '\nModels Trained:\n';
      context.modelResults.forEach((model: any) => {
        const performance = model.accuracy ? 
          `${(model.accuracy * 100).toFixed(1)}% accuracy` : 
          `${(model.r2_score * 100).toFixed(1)}% R² score`;
        contextText += `- ${model.algorithm}: ${performance}\n`;
        contextText += `  Features used: ${model.features_used.join(', ')}\n`;
        if (model.feature_importance) {
          const topFeatures = Object.entries(model.feature_importance)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([name, importance]) => `${name} (${((importance as number) * 100).toFixed(1)}%)`)
            .join(', ');
          contextText += `  Top features: ${topFeatures}\n`;
        }
      });
    }

    // Visualizations
    if (context.visualizationResults && context.visualizationResults.length > 0) {
      contextText += '\nVisualizations Created:\n';
      context.visualizationResults.forEach((viz: any) => {
        contextText += `- ${viz.chart_type}: ${viz.columns_used.join(', ')}\n`;
        if (viz.insights) {
          contextText += `  Insights: ${viz.insights.join(', ')}\n`;
        }
      });
    }

    return contextText;
  }

  /**
   * Get simulation result when AI is not available
   */
  private getSimulationResult(input: any, context: any) {
    let explanation = '';

    switch (input.action) {
      case 'explain':
        explanation = `This analysis involved ${input.context?.agentActions?.length || 0} agent actions. ` +
          `The dataset has ${input.context?.datasetInfo?.rows || 0} rows and ${input.context?.datasetInfo?.columns || 0} columns. ` +
          `Key operations included data cleaning, feature engineering, and model training.`;
        break;
      case 'summarize':
        explanation = `Analysis Summary: Processed ${input.context?.datasetInfo?.rows || 0} data points across ${input.context?.datasetInfo?.columns || 0} features. ` +
          `Trained ${input.context?.modelResults?.length || 0} models and created ${input.context?.visualizationResults?.length || 0} visualizations. ` +
          `The analysis provides insights into the dataset patterns and relationships.`;
        break;
      case 'answer_question':
        explanation = `Question: "${input.context?.userQuestion || 'No question provided'}"\n\n` +
          `Answer: Based on the analysis performed, I can provide insights about the dataset and models. ` +
          `The analysis shows various patterns and relationships in the data. ` +
          `For more specific answers, please provide more context about what you'd like to know.`;
        break;
      default:
        explanation = 'Simulation mode - AI not available for detailed explanations.';
    }

    return {
      action: "explanation_generated",
      reasoning: "Simulation mode - AI not available",
      explanation: explanation,
      summary: {
        type: input.action,
        explanation: explanation,
        timestamp: new Date().toISOString(),
        agent: 'explainer'
      }
    };
  }

  /**
   * Generate reasoning log entry
   */
  generateReasoningLog(action: string, context: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      agent: 'explainer',
      action,
      context: {
        dataset_info: context.datasetInfo,
        agent_actions_count: context.agentActions?.length || 0,
        model_results_count: context.modelResults?.length || 0,
        visualization_count: context.visualizationResults?.length || 0
      },
      reasoning: `Explainer agent ${action} for analysis session`
    };

    return JSON.stringify(logEntry, null, 2);
  }

  /**
   * Get common questions and answers
   */
  getCommonQuestions(): Array<{question: string, answer: string}> {
    return [
      {
        question: "Why did you drop column X?",
        answer: "Column X was dropped because it had a high percentage of missing values (>50%) which would negatively impact model performance. This is a standard practice in data preprocessing."
      },
      {
        question: "What features are most important?",
        answer: "The most important features are determined by the model's feature importance scores. You can see these in the modeling results panel, where features are ranked by their contribution to the model's predictions."
      },
      {
        question: "How accurate is the model?",
        answer: "Model accuracy depends on the algorithm and data quality. Check the modeling results for specific accuracy metrics. Generally, accuracy above 80% is considered good for classification, and R² above 0.7 is good for regression."
      },
      {
        question: "What does this visualization show?",
        answer: "Each visualization is designed to reveal specific patterns in your data. Histograms show distributions, scatter plots show relationships, and heatmaps show correlations between variables."
      },
      {
        question: "Should I collect more data?",
        answer: "More data can improve model performance, especially if you have fewer than 1000 samples. However, data quality is more important than quantity - ensure your data is clean and representative."
      }
    ];
  }
}