import React, { useState, useRef, useEffect } from 'react';
import { useCedarOS } from '../contexts/CedarOSContext';

const ChatPanel: React.FC = () => {
  const { chatMessages, addChatMessage } = useCedarOS();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 10);
  }, [chatMessages]);

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to CedarOS state
    addChatMessage({
      text: userMessage,
      sender: 'user'
    });

    // Simulate assistant response
    setTimeout(() => {
      const responses = [
        "I understand you want to analyze your data. Let me help you with that.",
        "I can see you have a dataset loaded. Would you like me to clean it or create visualizations?",
        "Based on your data, I recommend using the Data Cleaner agent first to handle missing values.",
        "I've identified some patterns in your data. The Correlation Expert agent can help explore relationships.",
        "Your dataset looks good! The Visualizer agent can create some insightful charts.",
        "I can help you build predictive models with the Modeler agent.",
        "Let me explain what I found in your analysis...",
        "I've processed your request and updated the workspace accordingly.",
        "The analysis is complete. Would you like me to explain the results?",
        "I've generated some insights from your data. Check the timeline for agent proposals."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      addChatMessage({
        text: randomResponse,
        sender: 'assistant'
      });
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <h3>Chat</h3>
      <div className="messages" ref={messagesContainerRef}>
        {chatMessages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me to analyze your data..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;