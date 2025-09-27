import { z } from 'zod';
import { ConversationBufferMemory } from 'langchain/memory';

/**
 * BaseAgent - Core agent class to replace Mastra Agent
 * Provides identity, memory, tools, and execution capabilities
 */
export abstract class BaseAgent {
  id: string;
  name: string;
  instructions: string;
  tools: Record<string, Tool>;
  memory: ConversationBufferMemory;
  metadata: Record<string, any>;

  constructor(config: {
    id: string;
    name: string;
    instructions: string;
    tools?: Record<string, Tool>;
    metadata?: Record<string, any>;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.instructions = config.instructions;
    this.tools = config.tools || {};
    this.metadata = config.metadata || {};
    
    // Initialize memory for this agent
    this.memory = new ConversationBufferMemory({
      memoryKey: "chat_history",
      returnMessages: true,
    });
  }

  /**
   * Execute agent logic - must be implemented by subclasses
   */
  abstract run(input: any, context?: any): Promise<any>;

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, input: any): Promise<any> {
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found for agent '${this.id}'`);
    }
    
    try {
      const result = await tool.func(input);
      // Validate output if schema is provided
      if (tool.outputSchema) {
        return tool.outputSchema.parse(result);
      }
      return result;
    } catch (error) {
      console.error(`Tool execution failed for '${toolName}':`, error);
      throw error;
    }
  }

  /**
   * Add message to agent memory
   */
  async addToMemory(input: string, output: string): Promise<void> {
    await this.memory.saveContext(
      { input },
      { output }
    );
  }

  /**
   * Get agent memory as string
   */
  async getMemoryAsString(): Promise<string> {
    return await this.memory.loadMemoryVariables({});
  }
}

/**
 * Tool interface for agent capabilities
 */
export interface Tool {
  name: string;
  description: string;
  func: (input: any) => Promise<any>;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
}
