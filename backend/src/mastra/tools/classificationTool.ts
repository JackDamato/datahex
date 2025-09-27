import { createTool } from "@mastra/core/tools";
import { z, ZodType, ZodTypeDef } from "zod";

const inputSchema = z.object({
  userQuery: z.string(),
}) as unknown as ZodType<any, ZodTypeDef, any>;

const outputSchema = z.object({
  needsClarification: z.boolean(),
  question: z.string().optional(),
}) as unknown as ZodType<any, ZodTypeDef, any>;

export const clarificationTool = createTool({
  id: "orchestrator.clarification",
  description: "Check if user query needs clarification.",
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const { userQuery } = context;
    if (userQuery.toLowerCase().includes("unclear")) {
      return { needsClarification: true, question: "Can you clarify the dataset?" };
    }
    return { needsClarification: false };
  },
});
