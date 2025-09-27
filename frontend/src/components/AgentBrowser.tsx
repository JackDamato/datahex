import React, { useState } from 'react';
import { useCedarOS, type Agent } from '../contexts/CedarOSContext';
import './AgentBrowser.css';

const AgentBrowser: React.FC = () => {
  const { addCanvasCard, addAgentProposal, updateCanvasCard, updateAgentProposal, canvasCards, agentProposals } = useCedarOS();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  // Define the 6 agents
  const agents: Agent[] = [
    {
      id: 'data_cleaner',
      name: 'Data Cleaner',
      description: 'Fix NaNs, type conversions, remove/add columns',
      icon: '🧹',
      isActive: false
    },
    {
      id: 'analyst_engineer',
      name: 'Analyst Engineer',
      description: 'Feature engineering, transformations',
      icon: '⚙️',
      isActive: false
    },
    {
      id: 'visualizer',
      name: 'Visualizer',
      description: 'Generate Plotly/Chart.js visualizations',
      icon: '📊',
      isActive: false
    },
    {
      id: 'correlation_expert',
      name: 'Correlation Expert',
      description: 'Find correlations, relationships, trends',
      icon: '🔗',
      isActive: false
    },
    {
      id: 'modeler',
      name: 'Modeler',
      description: 'Build predictive models with scikit-learn',
      icon: '🤖',
      isActive: false
    },
    {
      id: 'explainer',
      name: 'Explainer',
      description: 'Explain results to user, summarize outputs',
      icon: '💡',
      isActive: false
    }
  ];

  // Handle agent click - create canvas card and proposal
  const handleAgentClick = (agent: Agent) => {
    setActiveAgent(agent.id);
    
    // Create agent canvas card
    addCanvasCard({
      type: 'agent',
      title: `${agent.name} Agent`,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      width: 350,
      height: 250,
      agentId: agent.id,
      progress: 0,
      logs: [`${agent.name} agent started...`, 'Initializing workspace...', 'Analyzing data...']
    });

    // Create agent proposal
    addAgentProposal({
      agentId: agent.id,
      agentName: agent.name,
      action: getAgentAction(agent.id),
      description: getAgentDescription(agent.id),
      status: 'pending',
      data: { agentId: agent.id }
    });

    // Simulate agent progress
    simulateAgentProgress(agent.id);
  };

  // Get agent-specific action
  const getAgentAction = (agentId: string): string => {
    switch (agentId) {
      case 'data_cleaner':
        return 'Clean Dataset';
      case 'analyst_engineer':
        return 'Feature Engineering';
      case 'visualizer':
        return 'Create Visualization';
      case 'correlation_expert':
        return 'Analyze Correlations';
      case 'modeler':
        return 'Build Model';
      case 'explainer':
        return 'Generate Explanation';
      default:
        return 'Process Data';
    }
  };

  // Get agent-specific description
  const getAgentDescription = (agentId: string): string => {
    switch (agentId) {
      case 'data_cleaner':
        return 'Will clean missing values, fix data types, and remove duplicates';
      case 'analyst_engineer':
        return 'Will create new features and transform existing ones';
      case 'visualizer':
        return 'Will generate interactive charts and graphs';
      case 'correlation_expert':
        return 'Will find relationships and patterns in the data';
      case 'modeler':
        return 'Will build and train predictive models';
      case 'explainer':
        return 'Will explain results and provide insights';
      default:
        return 'Will process and analyze your data';
    }
  };

  // Simulate agent progress
  const simulateAgentProgress = (agentId: string) => {
    const progressSteps = [
      { progress: 20, log: 'Loading data...' },
      { progress: 40, log: 'Processing...' },
      { progress: 60, log: 'Analyzing patterns...' },
      { progress: 80, log: 'Generating results...' },
      { progress: 100, log: 'Task completed successfully!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];
        
        // Update canvas card progress - find the most recent agent card
        const agentCards = canvasCards.filter(card => card.type === 'agent' && card.agentId === agentId);
        if (agentCards.length > 0) {
          const latestCard = agentCards[agentCards.length - 1];
          updateCanvasCard(latestCard.id, {
            progress: step.progress,
            logs: [...(latestCard.logs || []), step.log]
          });
        }
        
        console.log(`Agent ${agentId} progress: ${step.progress}% - ${step.log}`);
        currentStep++;
      } else {
        clearInterval(interval);
        setActiveAgent(null);
        
        // Mark the agent proposal as completed
        const matchingProposals = agentProposals.filter(proposal => proposal.agentId === agentId);
        if (matchingProposals.length > 0) {
          const latestProposal = matchingProposals[matchingProposals.length - 1];
          updateAgentProposal(latestProposal.id, 'accepted');
        }
      }
    }, 2000);
  };

  return (
    <div className="agent-browser">
      <div className="agent-browser-header">
        <h3>AI Agents</h3>
        <div className="agent-count">{agents.length} available</div>
      </div>
      
      <div className="agents-list">
        {agents.map(agent => (
          <div 
            key={agent.id} 
            className={`agent-item ${activeAgent === agent.id ? 'active' : ''}`}
            onClick={() => handleAgentClick(agent)}
          >
            <div className="agent-icon">
              {agent.icon}
            </div>
            <div className="agent-info">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-description">{agent.description}</div>
            </div>
            <div className="agent-status">
              {activeAgent === agent.id ? (
                <div className="status-indicator running">
                  <div className="pulse"></div>
                </div>
              ) : (
                <div className="status-indicator idle"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="agent-browser-footer">
        <div className="agent-tip">
          💡 Click any agent to start a new analysis task
        </div>
      </div>
    </div>
  );
};

export default AgentBrowser;