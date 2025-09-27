import { z } from "zod";

const inputSchema = z.object({
  userQuery: z.string(),
});

const outputSchema = z.object({
  needsClarification: z.boolean(),
  question: z.string().optional(),
});

export const clarificationTool = {
  id: "orchestrator.clarification",
  description: "Check if user query needs clarification.",
  inputSchema,
  outputSchema,
  execute: async ({ context }: { context: { userQuery: string } }) => {
    const { userQuery } = context;

    // Simple rule-based clarification detection
    const lowerQuery = userQuery.toLowerCase();

    // Vague queries that need clarification
    const vaguePatterns = [
      /^analyze\s+(this|it|data)$/i,
      /^make\s+(a\s+)?chart$/i,
      /^build\s+(a\s+)?model$/i,
      /^create\s+(a\s+)?(plot|graph)$/i,
      /^do\s+something/i,
      /^help\s+me/i,
      /^what\s+should\s+i\s+do/i,
    ];

    const needsClarification = vaguePatterns.some((pattern) =>
      pattern.test(userQuery)
    );

    if (needsClarification) {
      let question = "Could you provide more specific details?";

      if (/analyze/i.test(userQuery)) {
        question =
          "What specific type of analysis would you like? (e.g., statistical summary, correlation analysis, data quality check)";
      } else if (/chart|plot|graph/i.test(userQuery)) {
        question =
          "What type of chart would you like and which variables should be included?";
      } else if (/model/i.test(userQuery)) {
        question =
          "What type of model do you need and what are you trying to predict or classify?";
      }

      return { needsClarification: true, question };
    }

    return { needsClarification: false };
  },
};
