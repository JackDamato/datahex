import { z } from 'zod';
import { Agent } from '@mastra/core';
import { queryDatabase } from '../../db';
import { clarificationQueue } from '../queues/clarificationQueue';
// import { agentRegistry } from '../agentRegistry'; // Removed to avoid circular dependency
import { clarificationTool } from '../tools/clarificationTool';
import { classificationTool } from '../tools/classificationTool';

/**
 * OrchestratorAgent - AI-powered workflow coordinator
 * Integrates with existing project/dataset DB model to make intelligent routing decisions
 */
export class OrchestratorAgent extends Agent {
  constructor() {
    super({
      id: "orchestrator",
      name: "Orchestrator Agent",
      instructions: `You are the Orchestrator Agent for a data science platform. Your job is to analyze user requests and decide which specialized agent should handle the task next.

Available Agents:
- cleaner: Data cleaning, null handling, type conversions
- analyst: Feature engineering, transformations, statistical analysis  
- visualizer: Chart generation, plotting, data visualization
- correlation: Finding relationships, correlations, trends in data
- modeling: Machine learning models, predictions, model training
- explainer: Result interpretation, summarization, insights

When making decisions, consider:
1. The user's query and intent
2. The current project state and dataset characteristics
3. Previous actions taken in the workflow
4. The most logical next step in a data science pipeline

Always provide a clear rationale for your decision and structure the input appropriately for the chosen agent.`,
      tools: {
        clarification_check: clarificationTool,
        agent_classification: classificationTool,
      },
      model: {
        provider: "openai",
        name: "gpt-4o-mini",
        modelId: "gpt-4o-mini",
        apiKey: process.env.OPENAI_API_KEY || "dummy-key"
      } as any
    });
  }

  /**
   * Execute orchestration logic
   * Resolves dataset from project and makes AI-powered routing decisions
   */
  async run(input: {
    projectId: string;
    userQuery: string;
    priorActions?: string[];
  }, context: {
    projectId: string;
    datasetId: string;
    priorActions: string[];
    metadata: Record<string, any>;
  }): Promise<any> {
    console.log(`🎭 OrchestratorAgent: Analyzing request for project ${input.projectId}`);
    console.log(`📝 User query: "${input.userQuery}"`);
    console.log(`📋 Prior actions: ${input.priorActions?.length || 0}`);

    try {
      // Get project information for context
      const projectData = await this.getProjectData(input.projectId);
      
      // Step 1: Check if we need clarification
      console.log('🔍 Checking if clarification is needed...');
      const clarification = await clarificationTool.execute({ userQuery: input.userQuery }, { signal: new AbortController().signal });
      
      if (clarification.needsClarification) {
        console.log('❓ Clarification needed:', clarification.question);
        
        // Queue the clarification question
        await clarificationQueue.enqueue({
          projectId: input.projectId,
          question: clarification.question ?? "Can you provide more details?",
          hints: [],
          timestamp: Date.now(),
        });
        
        return {
          action: "clarify",
          question: clarification.question,
          rationale: "User query was underspecified and requires clarification.",
        };
      }

      // Step 2: Classify which agent to call
      console.log('🤖 Classifying which agent should handle this request...');
      const classification = await classificationTool.execute({ userQuery: input.userQuery }, { signal: new AbortController().signal });
      
      console.log(`✅ Selected agent: ${classification.agentId}`);
      console.log(`💭 Reason: ${classification.reason}`);

      // Step 3: Call the selected agent directly (lazy import to avoid circular dependency)
      let agentResult = null;
      
      try {
        const agentRegistry = await import('../agentRegistry');
        const agent = agentRegistry.agentRegistry[classification.agentId];
        
        if (agent) {
          try {
            agentResult = await agent.run({
              datasetId: projectData?.datasetId || input.projectId,
              ...(projectData ? { datasetPath: projectData.datasetPath } : {})
            }, {
              projectId: input.projectId,
              datasetId: projectData?.datasetId || input.projectId,
              priorActions: input.priorActions || [],
              metadata: { source: "orchestrator" }
            });
          } catch (err: any) {
            console.error(`❌ Agent ${classification.agentId} execution failed:`, err.message);
            agentResult = { error: err.message };
          }
        } else {
          console.error(`❌ Agent not found: ${classification.agentId}`);
          agentResult = { error: `Agent ${classification.agentId} not found` };
        }
      } catch (importErr: any) {
        console.error(`❌ Failed to import agent registry:`, importErr.message);
        agentResult = { error: "Failed to access agent registry" };
      }

      return {
        action: "dispatch",
        targetAgent: classification.agentId,
        agentInput: { 
          datasetId: projectData?.datasetId || input.projectId,
          ...(projectData ? { datasetPath: projectData.datasetPath } : {})
        },
        agentResult,
        rationale: classification.reason,
      };

    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      
      // Fallback: Return a request for clarification
      return {
        action: "clarify",
        question: "I encountered an error processing your request. Could you please rephrase or provide more details?",
        rationale: "Error occurred during orchestration, requesting clarification as fallback"
      };
    }
  }

  /**
   * Get project and dataset data from existing database
   */
  private async getProjectData(projectId: string): Promise<{
    projectName: string;
    datasetId: string;
    datasetName: string;
    datasetPath: string;
    rows: number;
    columns: number;
  } | null> {
    try {
      console.log(`🔍 Querying database for project: ${projectId}`);
      
      // First check if project exists
      const projectQuery = `SELECT * FROM projects WHERE projectId = ?`;
      const projectResults = await queryDatabase(projectQuery, [projectId]);
      
      if (projectResults.length === 0) {
        console.log(`❌ Project ${projectId} not found`);
        return null;
      }
      
      console.log(`✅ Found project: ${projectResults[0].name}`);
      
      // Then check for datasets
      const datasetQuery = `SELECT * FROM datasets WHERE projectId = ?`;
      const datasetResults = await queryDatabase(datasetQuery, [projectId]);
      
      if (datasetResults.length === 0) {
        console.log(`⚠️ No datasets found for project ${projectId}`);
        return null;
      }
      
      console.log(`✅ Found dataset: ${datasetResults[0].name}`);
      
      const project = projectResults[0];
      const dataset = datasetResults[0];
      
      return {
        projectName: project.name,
        datasetId: dataset.datasetId,
        datasetName: dataset.name,
        datasetPath: dataset.path,
        rows: dataset.rows,
        columns: dataset.columns
      };
    } catch (error) {
      console.error('Database query failed:', error);
      return null;
    }
  }

}
