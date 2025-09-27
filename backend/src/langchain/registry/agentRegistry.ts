import { BaseAgent } from '../agents/BaseAgent';
import { Tool } from '../tools/Tool';
import { CleanerAgent } from '../agents/CleanerAgent';
import { clarificationTool } from '../tools/clarificationTool';
import { classificationTool } from '../tools/classificationTool';

/**
 * Agent Registry - Central registry for all agents and tools
 * Replaces Mastra's agent registry with LangChain-based system
 */

// Initialize all agents
const agents: BaseAgent[] = [
  new CleanerAgent(),
  // TODO: Add other agents as they are migrated
  // new AnalystAgent(),
  // new VisualizerAgent(),
  // new CorrelationAgent(),
  // new ModelingAgent(),
  // new ExplainerAgent(),
];

// Initialize all tools
const tools: Tool[] = [
  clarificationTool,
  classificationTool,
  // TODO: Add other tools as needed
];

export const agentRegistry = {
  agents: Object.fromEntries(agents.map(a => [a.id, a])),
  tools: Object.fromEntries(tools.map(t => [t.name, t])),
};

export function getAgent(agentId: string): BaseAgent | undefined {
  return agentRegistry.agents[agentId];
}

export function getTool(toolName: string): Tool | undefined {
  return agentRegistry.tools[toolName];
}

export function getAllAgents(): BaseAgent[] {
  return agents;
}

export function getAllTools(): Tool[] {
  return tools;
}

console.log(`🎭 LangChain Agent Registry initialized with ${agents.length} agents:`, agents.map(a => a.id));
console.log(`🔧 Registry contains ${tools.length} tools:`, tools.map(t => t.name));
