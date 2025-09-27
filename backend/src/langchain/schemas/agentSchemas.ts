import { z } from 'zod';

/**
 * Zod schemas for agent inputs and outputs
 * Ensures structured data validation across all agents
 */

// Common schemas
export const UserQuerySchema = z.object({
  userQuery: z.string().describe("The user's query or request"),
});

export const ProjectContextSchema = z.object({
  projectId: z.string(),
  datasetId: z.string(),
  priorActions: z.array(z.string()),
  metadata: z.record(z.any()),
});

// Clarification tool schemas
export const ClarificationInputSchema = UserQuerySchema;

export const ClarificationOutputSchema = z.object({
  needsClarification: z.boolean(),
  question: z.string().optional(),
  reasoning: z.string(),
});

// Classification tool schemas
export const ClassificationInputSchema = UserQuerySchema;

export const ClassificationOutputSchema = z.object({
  agentId: z.enum(["cleaner", "analyst", "visualizer", "correlation", "modeling", "explainer"]),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

// Agent-specific input schemas
export const CleanerInputSchema = z.object({
  datasetId: z.string(),
  datasetPath: z.string().optional(),
  cleaningOptions: z.object({
    removeNulls: z.boolean().optional(),
    fillMissing: z.string().optional(),
    standardizeTypes: z.boolean().optional(),
  }).optional(),
});

export const AnalystInputSchema = z.object({
  datasetId: z.string(),
  datasetPath: z.string().optional(),
  analysisType: z.enum(['descriptive', 'statistical', 'exploratory', 'comprehensive']).optional(),
  targetVariables: z.array(z.string()).optional(),
});

export const VisualizerInputSchema = z.object({
  datasetId: z.string(),
  datasetPath: z.string().optional(),
  chartType: z.enum(['scatter', 'histogram', 'bar', 'line', 'box', 'heatmap', 'auto']).optional(),
  variables: z.array(z.string()).optional(),
});

export const CorrelationInputSchema = z.object({
  datasetId: z.string(),
  datasetPath: z.string().optional(),
  analysisType: z.enum(['correlation', 'causality', 'relationships', 'comprehensive']).optional(),
  targetVariables: z.array(z.string()).optional(),
  method: z.enum(['pearson', 'spearman', 'kendall', 'auto']).optional(),
});

export const ModelingInputSchema = z.object({
  datasetId: z.string(),
  datasetPath: z.string().optional(),
  modelType: z.enum(['classification', 'regression', 'clustering', 'auto']).optional(),
  targetVariable: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export const ExplainerInputSchema = z.object({
  datasetId: z.string(),
  datasetPath: z.string().optional(),
  stakeholderType: z.enum(['technical', 'business', 'executive', 'general']).optional(),
  focusArea: z.string().optional(),
});

// Common output schemas
export const AgentResultSchema = z.object({
  action: z.string(),
  details: z.record(z.any()).optional(),
  reasoning: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const ErrorResultSchema = z.object({
  action: z.literal("error_occurred"),
  details: z.object({
    error: z.string(),
    message: z.string().optional(),
  }),
  reasoning: z.string(),
});

// Specific output schemas for each agent
export const CleanerOutputSchema = AgentResultSchema.extend({
  action: z.enum(["cleaning_completed", "error_occurred"]),
  details: z.object({
    cleanedPath: z.string().optional(),
    summary: z.object({
      originalRows: z.number(),
      cleanedRows: z.number(),
      issuesFound: z.array(z.string()),
      cleaningSteps: z.array(z.string()),
    }).optional(),
  }).optional(),
});

export const AnalystOutputSchema = AgentResultSchema.extend({
  action: z.enum(["analysis_completed", "error_occurred"]),
  details: z.object({
    statistics: z.record(z.any()).optional(),
    insights: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }).optional(),
});

export const VisualizerOutputSchema = AgentResultSchema.extend({
  action: z.enum(["visualization_created", "error_occurred"]),
  details: z.object({
    chartPath: z.string().optional(),
    chartType: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

export const CorrelationOutputSchema = AgentResultSchema.extend({
  action: z.enum(["correlation_analysis_completed", "error_occurred"]),
  details: z.object({
    correlations: z.array(z.any()).optional(),
    patterns: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }).optional(),
});

export const ModelingOutputSchema = AgentResultSchema.extend({
  action: z.enum(["model_trained", "error_occurred"]),
  details: z.object({
    modelPath: z.string().optional(),
    metrics: z.record(z.any()).optional(),
    predictions: z.array(z.any()).optional(),
  }).optional(),
});

export const ExplainerOutputSchema = AgentResultSchema.extend({
  action: z.enum(["explanation_generated", "error_occurred"]),
  details: z.object({
    summary: z.string().optional(),
    insights: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  }).optional(),
});
