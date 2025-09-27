/**
 * LangChain Agent System - Main entry point
 * Complete replacement for Mastra-based agent system
 */

// Export core classes
export { BaseAgent } from './agents/BaseAgent';
export { Tool, createTool } from './tools/Tool';

// Export orchestrator
export { Orchestrator } from './orchestrator/Orchestrator';

// Export agents
export { CleanerAgent } from './agents/CleanerAgent';

// Export tools
export { clarificationTool } from './tools/clarificationTool';
export { classificationTool } from './tools/classificationTool';

// Export schemas
export * from './schemas/agentSchemas';

// Export registry
export { agentRegistry, getAgent, getTool, getAllAgents, getAllTools } from './registry/agentRegistry';

/**
 * Create and configure the main orchestrator
 */
export function createOrchestrator() {
  const { getAllAgents, getAllTools } = require('./registry/agentRegistry');
  const { Orchestrator } = require('./orchestrator/Orchestrator');
  
  const agents = getAllAgents();
  const tools = getAllTools();
  
  return new Orchestrator(agents, tools);
}

/**
 * Quick setup function for the complete system
 */
export function setupLangChainSystem() {
  const orchestrator = createOrchestrator();
  
  console.log('🚀 LangChain Agent System initialized');
  console.log(`📊 Available agents: ${orchestrator.getAvailableAgents().join(', ')}`);
  console.log(`🔧 Available tools: ${orchestrator.getAvailableTools().join(', ')}`);
  
  return orchestrator;
}
