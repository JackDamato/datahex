import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function detectClarification(userQuery: string): Promise<{ needsClarification: boolean; question?: string }> {
  const prompt = `
User asked: "${userQuery}".
- If the question is vague or missing necessary details (like columns, variables, dataset specifics), say "yes" and suggest one short clarification question.
- If it's clear enough to act, say "no".
Answer in JSON:
{ "needsClarification": true|false, "question": "<string or null>" }
`;

  if (!client) {
    console.warn('⚠️ OpenAI client not available, using fallback');
    return { needsClarification: false };
  }

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      max_tokens: 100,
      messages: [{ role: "system", content: prompt }],
    });

    const content = resp.choices[0].message?.content ?? "{}";
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️ Clarification detection failed:', error);
    return { needsClarification: false };
  }
}

export async function classifyAgent(userQuery: string): Promise<{ agentId: string; reason: string }> {
  const prompt = `
User asked: "${userQuery}".
Decide which agent should handle it:
- cleaner → data cleaning, nulls, formatting, preprocessing
- analyst → statistics, summary, distributions, descriptive analysis
- visualizer → charts, plots, graphs, visualizations
- correlation → relationships, regression, features, correlations
- modeling → predictive ML, train/test, models, machine learning
- explainer → natural language explanations, storytelling, insights

Respond in JSON:
{ "agentId": "<id>", "reason": "<why>" }
`;

  if (!client) {
    console.warn('⚠️ OpenAI client not available, using fallback');
    return { agentId: "explainer", reason: "OpenAI not available, using default" };
  }

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 120,
      messages: [{ role: "system", content: prompt }],
    });

    const content = resp.choices[0].message?.content ?? '{"agentId": "explainer", "reason": "Default fallback"}';
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️ Agent classification failed:', error);
    return { agentId: "explainer", reason: "Default fallback due to error" };
  }
}
