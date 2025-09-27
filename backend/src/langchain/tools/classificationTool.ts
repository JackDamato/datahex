import { createTool } from './Tool';
import { 
  ClassificationInputSchema, 
  ClassificationOutputSchema 
} from '../schemas/agentSchemas';

/**
 * Classification Tool - Classifies user queries to select the appropriate worker agent
 * Migrated from Mastra createTool to LangChain-based system
 */
export const classificationTool = createTool({
  name: "agent_classification",
  description: "Analyze user queries and determine which specialized agent should handle the request",
  inputSchema: ClassificationInputSchema,
  outputSchema: ClassificationOutputSchema,
  func: async ({ userQuery }) => {
    try {
      const lowerQuery = userQuery.toLowerCase();
      
      // Define keywords for each agent
      const agentKeywords = {
        cleaner: [
          "clean", "cleaning", "missing", "null", "na", "remove", "drop", "fill", "impute",
          "data quality", "outliers", "duplicate", "format", "type conversion", "standardize",
        ],
        analyst: [
          "analyze", "analysis", "statistics", "statistical", "summary", "describe", "mean", "median",
          "standard deviation", "distribution", "explore", "exploration", "insights", "trends",
        ],
        visualizer: [
          "chart", "plot", "graph", "visualize", "visualization", "scatter", "histogram", "bar",
          "line", "box", "heatmap", "show", "display", "create chart", "generate plot",
        ],
        correlation: [
          "correlation", "relationship", "correlate", "association", "connection", "related",
          "dependence", "interaction", "link", "between", "versus", "vs",
        ],
        modeling: [
          "model", "predict", "prediction", "machine learning", "ml", "algorithm", "train",
          "classification", "regression", "clustering", "forecast", "estimate",
        ],
        explainer: [
          "explain", "explanation", "interpret", "interpretation", "summary", "summarize",
          "business", "insights", "meaning", "results", "findings", "conclusion",
        ],
      };
      
      // Score each agent based on keyword matches
      const scores: Record<string, number> = {};
      
      Object.entries(agentKeywords).forEach(([agentId, keywords]) => {
        scores[agentId] = keywords.reduce((score, keyword) => {
          return lowerQuery.includes(keyword) ? score + 1 : score;
        }, 0);
      });
      
      // Find the agent with the highest score
      const bestAgent = Object.entries(scores).reduce(
        (best, [agentId, score]) =>
          score > best.score ? { agentId, score } : best,
        { agentId: "explainer", score: 0 }
      );
      
      // Calculate confidence based on score difference
      const maxScore = Math.max(...Object.values(scores));
      const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0.1;
      
      // Generate reasoning
      let reason = `Selected ${bestAgent.agentId} agent`;
      if (bestAgent.score > 0) {
        const matchedKeywords =
          agentKeywords[bestAgent.agentId as keyof typeof agentKeywords].filter(
            (keyword) => lowerQuery.includes(keyword)
          );
        reason += ` based on keywords: ${matchedKeywords.join(", ")}`;
      } else {
        reason += " as default fallback";
      }
      
      return {
        agentId: bestAgent.agentId as
          | "cleaner"
          | "analyst"
          | "visualizer"
          | "correlation"
          | "modeling"
          | "explainer",
        reason,
        confidence,
      };
      
    } catch (error) {
      console.warn('⚠️ Classification tool failed:', (error as Error).message);
      return {
        agentId: "explainer" as const,
        reason: "Classification failed, using default fallback",
        confidence: 0.1,
      };
    }
  },
});
