import React, { useState, useEffect, useRef } from 'react';
import { useCedarOS } from '../contexts/CedarOSContext';
import './IntegratedChat.css';

interface ChatMessage {
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

interface ChatSession {
  id: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface CommonQuestion {
  question: string;
  answer: string;
}

const IntegratedChat: React.FC = () => {
  const { projectId, currentDataset } = useCedarOS();
  
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
  const [showCommonQuestions, setShowCommonQuestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Load common questions on mount
  useEffect(() => {
    loadCommonQuestions();
  }, []);

  // Create or load chat session when project changes
  useEffect(() => {
    if (projectId) {
      loadOrCreateSession();
    }
  }, [projectId]);

  const loadCommonQuestions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chat/common-questions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const questions = await response.json();
        setCommonQuestions(questions);
      }
    } catch (error) {
      console.error('Failed to load common questions:', error);
    }
  };

  const loadOrCreateSession = async () => {
    if (!projectId) return;

    try {
      // Try to get existing sessions
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const projectSessions = await response.json();
        setSessions(projectSessions);
        
        // Use the most recent session or create a new one
        if (projectSessions.length > 0) {
          const latestSession = projectSessions[0];
          setCurrentSession(latestSession);
        } else {
          await createNewSession();
        }
      } else {
        await createNewSession();
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      await createNewSession();
    }
  };

  const createNewSession = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const newSession = await response.json();
        setCurrentSession(newSession);
        setSessions(prev => [newSession, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/api/chat/sessions/${currentSession.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMessage }),
      });

      if (response.ok) {
        const assistantMessage = await response.json();
        
        // Update current session with new messages
        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, assistantMessage]
          };
        });
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const askCommonQuestion = (question: string) => {
    setMessage(question);
    setShowCommonQuestions(false);
    inputRef.current?.focus();
  };

  const generateSummary = async () => {
    if (!currentSession || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/chat/sessions/${currentSession.id}/summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const summaryMessage = await response.json();
        
        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, summaryMessage]
          };
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.type === 'user';
    const isSystem = msg.type === 'system';

    return (
      <div key={msg.id} className={`message ${isUser ? 'user' : isSystem ? 'system' : 'assistant'}`}>
        <div className="message-content">
          <div className="message-header">
            <span className="message-type">
              {isUser ? '👤 You' : isSystem ? '⚙️ System' : '🤖 Explainer'}
            </span>
            <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
          </div>
          <div className="message-text">
            {msg.content.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          {msg.metadata?.agent && (
            <div className="message-metadata">
              <span className="agent-info">
                Powered by {msg.metadata.agent} • {msg.metadata.action}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`integrated-chat ${isExpanded ? 'expanded' : ''}`}>
      <div className="chat-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <h3>💬 Chat with Explainer</h3>
          <span className="session-info">
            {currentSession ? `${currentSession.messages.length} messages` : 'No session'}
          </span>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn summary-btn"
            onClick={(e) => {
              e.stopPropagation();
              generateSummary();
            }}
            disabled={isLoading || !currentSession}
            title="Generate analysis summary"
          >
            📋 Summary
          </button>
          <button 
            className="action-btn questions-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowCommonQuestions(!showCommonQuestions);
            }}
            title="Common questions"
          >
            ❓
          </button>
          <button className="expand-btn">
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="chat-content">
          {/* Common Questions Panel */}
          {showCommonQuestions && (
            <div className="common-questions-panel">
              <h4>Common Questions</h4>
              <div className="questions-list">
                {commonQuestions.map((q, index) => (
                  <button
                    key={index}
                    className="question-btn"
                    onClick={() => askCommonQuestion(q.question)}
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="messages-container">
            {currentSession?.messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h4>Start a conversation</h4>
                <p>Ask me anything about your data analysis!</p>
                <div className="suggestions">
                  <button 
                    className="suggestion-btn"
                    onClick={() => askCommonQuestion("What features are most important?")}
                  >
                    What features are most important?
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => askCommonQuestion("How accurate is the model?")}
                  >
                    How accurate is the model?
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => askCommonQuestion("What does this visualization show?")}
                  >
                    What does this visualization show?
                  </button>
                </div>
              </div>
            ) : (
              currentSession?.messages.map(renderMessage)
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-type">🤖 Explainer</span>
                  </div>
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your analysis..."
                disabled={isLoading}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || isLoading}
                className="send-btn"
              >
                {isLoading ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedChat;
