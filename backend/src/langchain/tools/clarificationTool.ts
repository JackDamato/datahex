import { createTool } from './Tool';
import { 
  ClarificationInputSchema, 
  ClarificationOutputSchema 
} from '../schemas/agentSchemas';

/**
 * Clarification Tool - Determines if user query needs clarification
 * Migrated from Mastra createTool to LangChain-based system
 */
export const clarificationTool = createTool({
  name: "clarification_check",
  description: "Analyze user queries to determine if clarification is needed before proceeding",
  inputSchema: ClarificationInputSchema,
  outputSchema: ClarificationOutputSchema,
  func: async ({ userQuery }) => {
    try {
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
        
        return {
          needsClarification: true,
          question,
          reasoning: "Query lacks sufficient specificity to take action",
        };
      }
      
      return {
        needsClarification: false,
        reasoning: "Query contains enough information to proceed",
      };
      
    } catch (error) {
      console.warn('⚠️ Clarification tool failed:', (error as Error).message);
      return {
        needsClarification: false,
        reasoning: "Clarification analysis failed, assuming query is clear",
      };
    }
  },
});
