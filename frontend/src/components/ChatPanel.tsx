import React, { useState } from 'react'

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'assistant'}>>([
    { id: '1', text: 'Welcome to Data Science Copilot! Upload a dataset to get started.', sender: 'assistant' }
  ])
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { id: Date.now().toString(), text: input, sender: 'user' as const }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Stub response
    setTimeout(() => {
      const assistantMessage = { 
        id: (Date.now() + 1).toString(), 
        text: 'Hello from backend (stub) - CedarOS integration working!', 
        sender: 'assistant' as const 
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }

  return (
    <div className="chat-panel">
      <h3>Chat</h3>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me to analyze your data..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  )
}

export default ChatPanel

