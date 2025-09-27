import { runCleaner } from "../agents/cleanerAgent";

export const agentRegistry: Record<string, { id: string; run: Function }> = {
  cleaner: { id: "cleaner", run: runCleaner }
};