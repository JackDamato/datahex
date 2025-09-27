import { getProjectById, getDatasetsByProjectId } from '../db';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    agent?: string;
    action?: string;
    reasoning?: string;
  };
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();

  constructor() {
  }

  /**
   * Create a new chat session
   */
  createSession(projectId: string): ChatSession {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      projectId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get chat session by ID
   */
  getSession(sessionId: string): ChatSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Add message to chat session
   */
  addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...message
    };

    session.messages.push(newMessage);
    session.updatedAt = new Date().toISOString();

    return newMessage;
  }

  /**
   * Process user message and generate response
   */
  async processMessage(sessionId: string, userMessage: string, userId: string): Promise<ChatMessage | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Add user message
    const userMsg = this.addMessage(sessionId, {
      type: 'user',
      content: userMessage
    });

    if (!userMsg) return null;

    try {
      // Get project and dataset context
      const project = await getProjectById(session.projectId);
      if (!project || project.userId !== userId) {
        throw new Error('Project not found or access denied');
      }

      const datasets = await getDatasetsByProjectId(session.projectId);
      const dataset = datasets[0];

      // Build context for explainer agent
      const context = {
        agentActions: this.extractAgentActionsFromMessages(session.messages),
        userQuestion: userMessage,
        datasetInfo: dataset ? {
          name: dataset.name,
          rows: dataset.rows,
          columns: dataset.columns,
          columns_info: [] // Could be populated from actual dataset analysis
        } : undefined,
        modelResults: this.extractModelResultsFromMessages(session.messages),
        visualizationResults: this.extractVisualizationResultsFromMessages(session.messages)
      };

      // Get response from explainer agent (simplified)
      const response = {
        answer: "I can help you with data analysis tasks like cleaning data, creating visualizations, running correlations, and training models. What would you like to do?",
        confidence: 0.8,
        sources: []
      };

      // Add assistant response
      const assistantMsg = this.addMessage(sessionId, {
        type: 'assistant',
        content: response.answer,
        metadata: {
          agent: 'explainer',
          action: 'answer_question',
          reasoning: 'Simplified response'
        }
      });

      return assistantMsg;

    } catch (error) {
      console.error('Error processing chat message:', error);
      
      // Add error message
      const errorMsg = this.addMessage(sessionId, {
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        metadata: {
          agent: 'explainer',
          action: 'error',
          reasoning: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return errorMsg;
    }
  }

  /**
   * Get analysis summary
   */
  async getAnalysisSummary(sessionId: string, userId: string): Promise<ChatMessage | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    try {
      // Get project and dataset context
      const project = await getProjectById(session.projectId);
      if (!project || project.userId !== userId) {
        throw new Error('Project not found or access denied');
      }

      const datasets = await getDatasetsByProjectId(session.projectId);
      const dataset = datasets[0];

      // Build context for explainer agent
      const context = {
        agentActions: this.extractAgentActionsFromMessages(session.messages),
        datasetInfo: dataset ? {
          name: dataset.name,
          rows: dataset.rows,
          columns: dataset.columns
        } : undefined,
        modelResults: this.extractModelResultsFromMessages(session.messages),
        visualizationResults: this.extractVisualizationResultsFromMessages(session.messages)
      };

      // Get summary from explainer agent (simplified)
      const response = {
        summary: "Here's a summary of your data analysis session. You can continue with more analysis tasks or ask questions about your data.",
        keyInsights: []
      };

      // Add summary message
      const summaryMsg = this.addMessage(sessionId, {
        type: 'assistant',
        content: response.summary,
        metadata: {
          agent: 'explainer',
          action: 'summarize',
          reasoning: 'Simplified summary'
        }
      });

      return summaryMsg;

    } catch (error) {
      console.error('Error generating analysis summary:', error);
      return null;
    }
  }

  /**
   * Extract agent actions from chat messages
   */
  private extractAgentActionsFromMessages(messages: ChatMessage[]): Array<{
    agent: string;
    action: string;
    reasoning: string;
    timestamp: string;
    result?: any;
  }> {
    return messages
      .filter(msg => msg.metadata?.agent && msg.metadata?.action)
      .map(msg => ({
        agent: msg.metadata!.agent!,
        action: msg.metadata!.action!,
        reasoning: msg.metadata!.reasoning || 'No reasoning provided',
        timestamp: msg.timestamp,
        result: msg.content
      }));
  }

  /**
   * Extract model results from chat messages
   */
  private extractModelResultsFromMessages(messages: ChatMessage[]): Array<{
    algorithm: string;
    accuracy?: number;
    r2_score?: number;
    features_used: string[];
    feature_importance: Record<string, number>;
  }> {
    // This would be populated from actual model training results
    // For now, return empty array
    return [];
  }

  /**
   * Extract visualization results from chat messages
   */
  private extractVisualizationResultsFromMessages(messages: ChatMessage[]): Array<{
    chart_type: string;
    columns_used: string[];
    insights?: string[];
  }> {
    // This would be populated from actual visualization results
    // For now, return empty array
    return [];
  }

  /**
   * Get common questions for the project
   */
  getCommonQuestions(): Array<{question: string, answer: string}> {
    return [
      { question: "How do I clean my data?", answer: "You can clean your data by removing null values, handling missing data, or transforming columns. Try asking: 'Remove nulls from my dataset' or 'Clean the data'." },
      { question: "How do I create visualizations?", answer: "You can create charts and graphs by asking: 'Create a scatter plot of revenue vs profit' or 'Show me a histogram of sales data'." },
      { question: "How do I analyze correlations?", answer: "Ask for correlation analysis: 'Find correlations in my data' or 'Analyze relationships between columns'." },
      { question: "How do I train a model?", answer: "You can train machine learning models by asking: 'Train a model to predict profit from revenue' or 'Create a classification model'." }
    ];
  }

  /**
   * Clear session
   */
  clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions for a project
   */
  getProjectSessions(projectId: string): ChatSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

// Export singleton instance
export const chatService = new ChatService();
