import React from 'react'

const agents = [
  { name: 'Cleaner', role: 'Fix NaNs, type conversions, remove/add columns', icon: '🧹' },
  { name: 'AnalystEngineer', role: 'Feature engineering, transformations', icon: '⚙️' },
  { name: 'Visualizer', role: 'Generate Plotly/Chart.js visualizations', icon: '📊' },
  { name: 'CorrelationExpert', role: 'Find correlations, relationships, trends', icon: '🔗' },
  { name: 'Modeler', role: 'Build predictive models with scikit-learn', icon: '🤖' },
  { name: 'Explainer', role: 'Explain results to user, summarize outputs', icon: '💡' }
]

const AgentBrowser: React.FC = () => {
  const handleAgentClick = (agentName: string) => {
    console.log(`Clicked on ${agentName} agent`)
    // TODO: Integrate with Mastra orchestrator
  }

  return (
    <div className="agent-browser">
      <h3>Agents</h3>
      <div className="agents-list">
        {agents.map(agent => (
          <div 
            key={agent.name} 
            className="agent-item"
            onClick={() => handleAgentClick(agent.name)}
          >
            <span className="agent-icon">{agent.icon}</span>
            <div className="agent-info">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-role">{agent.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentBrowser

