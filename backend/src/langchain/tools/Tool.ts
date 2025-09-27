import { z } from 'zod';

/**
 * Tool class for agent capabilities
 * Replaces Mastra's createTool functionality
 */
export class Tool {
  name: string;
  description: string;
  func: (input: any) => Promise<any>;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;

  constructor(config: {
    name: string;
    description: string;
    func: (input: any) => Promise<any>;
    inputSchema?: z.ZodSchema;
    outputSchema?: z.ZodSchema;
  }) {
    this.name = config.name;
    this.description = config.description;
    this.func = config.func;
    this.inputSchema = config.inputSchema;
    this.outputSchema = config.outputSchema;
  }

  /**
   * Execute tool with input validation
   */
  async execute(input: any): Promise<any> {
    // Validate input if schema is provided
    if (this.inputSchema) {
      input = this.inputSchema.parse(input);
    }

    const result = await this.func(input);

    // Validate output if schema is provided
    if (this.outputSchema) {
      return this.outputSchema.parse(result);
    }

    return result;
  }
}

/**
 * Helper function to create tools (similar to createTool from Mastra)
 */
export function createTool(config: {
  name: string;
  description: string;
  func: (input: any) => Promise<any>;
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
}): Tool {
  return new Tool(config);
}
