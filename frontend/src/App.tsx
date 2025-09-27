import React from 'react'
import ChatPanel from './components/ChatPanel'
import AgentBrowser from './components/AgentBrowser'
import Canvas from './components/Canvas'
import LiveSummaryStats from './components/LiveSummaryStats'
import './App.css'

// Stub CedarCopilot component for development
const CedarCopilot: React.FC<{ 
  provider: string; 
  config: { baseUrl: string; apiKey: string }; 
  children: React.ReactNode 
}> = ({ children }) => {
  return <>{children}</>
}

function App() {
  return (
    <CedarCopilot
      provider="mastra"
      config={{
        baseUrl: import.meta.env.VITE_MASTRA_BASE_URL || 'http://localhost:3001',
        apiKey: import.meta.env.VITE_MASTRA_API_KEY || 'stub-key-for-development'
      }}
    >
      <div className="app">
        <div className="left-sidebar">
          <ChatPanel />
          <AgentBrowser />
        </div>
        
        <div className="center-workspace">
          <Canvas />
        </div>
        
        <div className="right-sidebar">
          <LiveSummaryStats />
        </div>
      </div>
    </CedarCopilot>
  )
}

export default App
