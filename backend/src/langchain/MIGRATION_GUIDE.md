# Migration Guide: Mastra → LangChain Agent System

This guide explains how to migrate from the Mastra-based agent system to the new LangChain-based system.

## Key Changes

### 1. Agent Definition
**Before (Mastra):**
```typescript
export class CleanerAgent extends Agent {
  constructor() {
    super({
      id: "cleaner",
      name: "Data Cleaner",
      instructions: "...",
      tools: {},
      model: { provider: "openai", name: "gpt-4o-mini" }
    });
  }
}
```

**After (LangChain):**
```typescript
export class CleanerAgent extends BaseAgent {
  constructor() {
    super({
      id: "cleaner",
      name: "Data Cleaner",
      instructions: "...",
      metadata: { role: "data_cleaning" }
    });
  }
}
```

### 2. Tool Creation
**Before (Mastra):**
```typescript
export const clarificationTool = createTool({
  id: "orchestrator.clarification",
  description: "...",
  inputSchema: z.object({ userQuery: z.string() }),
  outputSchema: z.object({ needsClarification: z.boolean() }),
  execute: async ({ userQuery }) => { ... }
});
```

**After (LangChain):**
```typescript
export const clarificationTool = createTool({
  name: "clarification_check",
  description: "...",
  inputSchema: ClarificationInputSchema,
  outputSchema: ClarificationOutputSchema,
  func: async ({ userQuery }) => { ... }
});
```

### 3. AI Calls
**Before (Mastra):**
```typescript
const response = await this.generateVNext([
  { role: "system", content: systemPrompt },
  { role: "user", content: userPrompt }
]);
const result = JSON.parse(response.text || '{}');
```

**After (LangChain):**
```typescript
const model = openai('gpt-4o-mini');
const result = await model.generate([
  { role: "system", content: systemPrompt },
  { role: "user", content: userPrompt }
]);
const responseText = result.text;
```

### 4. Orchestration
**Before (Mastra):**
```typescript
const clarification = await clarificationTool.execute({
  context: { userQuery: input.userQuery }
} as any);
```

**After (LangChain):**
```typescript
const clarification = await this.tools["clarification_check"].execute({ 
  userQuery: input.userQuery 
});
```

## Migration Steps

1. **Replace Agent Base Class**
   - Change `extends Agent` to `extends BaseAgent`
   - Remove `model` configuration from constructor
   - Add `metadata` for agent identity

2. **Update Tool Definitions**
   - Replace `createTool` with new LangChain-compatible version
   - Use schema imports instead of inline definitions
   - Change `execute` parameter structure

3. **Update AI Calls**
   - Replace `this.generateVNext()` with `openai()` model calls
   - Update response handling
   - Remove Mastra-specific streaming logic

4. **Update Orchestrator**
   - Replace tool execution calls
   - Update parameter passing
   - Use new validation schemas

5. **Update Imports**
   - Replace Mastra imports with LangChain imports
   - Add schema imports
   - Update registry imports

## Benefits of Migration

1. **Better Type Safety**: Zod schemas ensure structured inputs/outputs
2. **Memory Management**: Built-in conversation memory per agent
3. **Modular Design**: Clean separation of agents, tools, and schemas
4. **AI SDK v5 Compatibility**: Direct integration with latest AI models
5. **Simplified Orchestration**: Centralized routing with validation
6. **Extensibility**: Easy to add new agents and tools

## Testing Migration

Use the provided test files to verify migration:
- `testLangChainSystem.ts` - Basic system functionality
- `testAgentMigration.ts` - Agent-specific tests
- `testOrchestratorMigration.ts` - Orchestration tests
