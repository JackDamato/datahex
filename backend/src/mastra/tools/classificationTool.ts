import { z } from "zod";

const inputSchema = z.object({
  userQuery: z.string(),
});

const outputSchema = z.object({
  agentId: z.enum([
    "cleaner",
    "analyst",
    "visualizer",
    "correlation",
    "modeling",
    "explainer",
  ]),
  reason: z.string(),
});

export const classificationTool = {
  id: "orchestrator.classification",
  description: "Classify which agent should handle the user query.",
  inputSchema,
  outputSchema,
  execute: async ({ context }: { context: { userQuery: string } }) => {
    const { userQuery } = context;
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
        "engineer", "engineering", "features", "feature", "transform", "transformation",
        "create features", "new features", "feature creation", "data engineering"
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

    // Score each agent based on keyword matches with priority weighting
    const scores: Record<string, number> = {};
    Object.entries(agentKeywords).forEach(([agentId, keywords]) => {
      scores[agentId] = keywords.reduce((score, keyword) => {
        if (lowerQuery.includes(keyword)) {
          // Give higher priority to more specific keywords
          if (keyword.includes('correlation') || keyword.includes('relationship')) {
            return score + 3; // High priority for correlation-specific terms
          } else if (keyword.includes('model') || keyword.includes('predict')) {
            return score + 3; // High priority for modeling terms
          } else if (keyword.includes('chart') || keyword.includes('plot')) {
            return score + 3; // High priority for visualization terms
          } else if (keyword.includes('clean') || keyword.includes('missing')) {
            return score + 3; // High priority for cleaning terms
          } else {
            return score + 1; // Standard priority for other terms
          }
        }
        return score;
      }, 0);
    });

    // Find the agent with the highest score
    const bestAgent = Object.entries(scores).reduce(
      (best, [agentId, score]) =>
        score > best.score ? { agentId, score } : best,
      { agentId: "explainer", score: 0 }
    );

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
    };
  },
};
