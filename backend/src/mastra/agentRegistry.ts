import { OrchestratorAgent } from "./agents/orchestratorAgent";
import { CleanerAgent } from "./agents/cleanerAgent";
import { AnalystAgent } from "./agents/analystAgent";
import { VisualizerAgent } from "./agents/visualizerAgent";
import { CorrelationAgent } from "./agents/correlationAgent";
import { ModelingAgent } from "./agents/modelingAgent";
import { ExplainerAgent } from "./agents/explainerAgent";

export const agentRegistry: Record<string, any> = {
  orchestrator: new OrchestratorAgent(),
  cleaner: new CleanerAgent(),
  analyst: new AnalystAgent(),
  visualizer: new VisualizerAgent(),
  correlation: new CorrelationAgent(),
  modeling: new ModelingAgent(),
  explainer: new ExplainerAgent(),
};

console.log(`🎭 Agent Registry initialized with ${Object.keys(agentRegistry).length} agents:`, Object.keys(agentRegistry));
