import { BaseAgent, Tool } from '../agents/BaseAgent';
import { 
  ClarificationInputSchema, 
  ClarificationOutputSchema,
  ClassificationInputSchema,
  ClassificationOutputSchema,
  ProjectContextSchema
} from '../schemas/agentSchemas';

/**
 * Orchestrator - Central routing system for agent coordination
 * Replaces Mastra's orchestrator functionality with LangChain-based system
 */
export class Orchestrator {
  agents: Record<string, BaseAgent>;
  tools: Record<string, Tool>;

  constructor(agents: BaseAgent[], tools: Tool[]) {
    this.agents = Object.fromEntries(agents.map(a => [a.id, a]));
    this.tools = Object.fromEntries(tools.map(t => [t.name, t]));
  }

  /**
   * Main orchestration method - routes user queries to appropriate agents
   */
  async run(userQuery: string, projectContext: any): Promise<any> {
    console.log(`🎭 Orchestrator: Processing query for project ${projectContext.projectId}`);
    console.log(`📝 User query: "${userQuery}"`);

    try {
      // Validate project context
      const validatedContext = ProjectContextSchema.parse(projectContext);

      // Step 1: Check if clarification is needed
      console.log('🔍 Checking if clarification is needed...');
      const clarification = await this.tools["clarification_check"].execute({ userQuery });
      const validatedClarification = ClarificationOutputSchema.parse(clarification);

      if (validatedClarification.needsClarification) {
        console.log('❓ Clarification needed:', validatedClarification.question);
        
        return {
          action: "clarify",
          question: validatedClarification.question,
          rationale: validatedClarification.reasoning,
        };
      }

      // Step 2: Classify which agent should handle the request
      console.log('🤖 Classifying which agent should handle this request...');
      const classification = await this.tools["agent_classification"].execute({ userQuery });
      const validatedClassification = ClassificationOutputSchema.parse(classification);

      console.log(`✅ Selected agent: ${validatedClassification.agentId}`);
      console.log(`💭 Reason: ${validatedClassification.reason}`);

      // Step 3: Dispatch to selected agent
      const targetAgent = this.agents[validatedClassification.agentId];
      if (!targetAgent) {
        throw new Error(`Agent '${validatedClassification.agentId}' not found`);
      }

      let agentResult = null;
      try {
        // Prepare agent input
        const agentInput = {
          datasetId: validatedContext.datasetId,
          ...(validatedContext.metadata?.datasetPath ? { datasetPath: validatedContext.metadata.datasetPath } : {})
        };

        agentResult = await targetAgent.run(agentInput, validatedContext);
        
        // Add to agent memory
        await targetAgent.addToMemory(userQuery, JSON.stringify(agentResult));

      } catch (err: any) {
        console.error(`❌ Agent ${validatedClassification.agentId} execution failed:`, err.message);
        agentResult = { 
          action: "error_occurred",
          details: { error: "Agent execution failed", message: err.message },
          reasoning: `Agent ${validatedClassification.agentId} failed to process request`
        };
      }

      return {
        action: "dispatch",
        targetAgent: validatedClassification.agentId,
        agentInput: { 
          datasetId: validatedContext.datasetId,
          ...(validatedContext.metadata?.datasetPath ? { datasetPath: validatedContext.metadata.datasetPath } : {})
        },
        agentResult,
        rationale: validatedClassification.reason,
        confidence: validatedClassification.confidence,
      };

    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      
      return {
        action: "clarify",
        question: "I encountered an error processing your request. Could you please rephrase or provide more details?",
        rationale: "Error occurred during orchestration, requesting clarification as fallback"
      };
    }
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): string[] {
    return Object.keys(this.agents);
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return Object.keys(this.tools);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents[agentId];
  }

  /**
   * Get tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools[toolName];
  }
}
