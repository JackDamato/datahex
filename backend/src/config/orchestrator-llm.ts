import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set. Agents that call LLM will fail.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// Minimal adapter to match what your Mastra version expects.
// It forwards chat.completions.create calls to the OpenAI SDK.
export const model = {
  chat: {
    completions: {
      create: (args: any) => openai.chat.completions.create(args)
    }
  }
} as any;