import React from 'react';
import { useCedarOS, type AgentProposal } from '../contexts/CedarOSContext';
import './Timeline.css';

const Timeline: React.FC = () => {
  const { agentProposals, updateAgentProposal } = useCedarOS();

  // Handle proposal acceptance
  const handleAccept = (proposalId: string) => {
    updateAgentProposal(proposalId, 'accepted');
    
    // Simulate state change in canvas
    console.log(`Proposal ${proposalId} accepted - updating canvas state`);
    
    // In a real implementation, this would trigger actual state changes
    // For now, we'll just log the action
  };

  // Handle proposal rejection
  const handleReject = (proposalId: string) => {
    updateAgentProposal(proposalId, 'rejected');
    console.log(`Proposal ${proposalId} rejected`);
  };

  // Get status color
  const getStatusColor = (status: AgentProposal['status']) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'accepted':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // Get status icon
  const getStatusIcon = (status: AgentProposal['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  // Get agent icon
  const getAgentIcon = (agentId: string) => {
    const agentIcons: { [key: string]: string } = {
      'data_cleaner': '🧹',
      'analyst_engineer': '⚙️',
      'visualizer': '📊',
      'correlation_expert': '🔗',
      'modeler': '🤖',
      'explainer': '💡'
    };
    return agentIcons[agentId] || '🤖';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="timeline">
      <div className="timeline-header">
        <h3>Agent Proposals</h3>
        <div className="timeline-count">
          {agentProposals.filter(p => p.status === 'pending').length} pending
        </div>
      </div>

      <div className="timeline-content">
        {agentProposals.length === 0 ? (
          <div className="no-proposals">
            <div className="no-proposals-icon">📋</div>
            <p>No agent proposals yet</p>
            <p className="proposal-hint">Click an agent to generate proposals</p>
          </div>
        ) : (
          <div className="proposals-list">
            {agentProposals
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((proposal) => (
                <div key={proposal.id} className={`proposal-card ${proposal.status}`}>
                  <div className="proposal-header">
                    <div className="proposal-agent">
                      <span className="agent-icon">
                        {getAgentIcon(proposal.agentId)}
                      </span>
                      <div className="agent-info">
                        <div className="agent-name">{proposal.agentName}</div>
                        <div className="proposal-time">
                          {formatTimestamp(proposal.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="proposal-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(proposal.status) }}
                      >
                        {getStatusIcon(proposal.status)} {proposal.status}
                      </span>
                    </div>
                  </div>

                  <div className="proposal-content">
                    <div className="proposal-action">
                      <strong>{proposal.action}</strong>
                    </div>
                    <div className="proposal-description">
                      {proposal.description}
                    </div>
                  </div>

                  {proposal.status === 'pending' && (
                    <div className="proposal-actions">
                      <button
                        className="action-btn accept"
                        onClick={() => handleAccept(proposal.id)}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="action-btn reject"
                        onClick={() => handleReject(proposal.id)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {proposal.status === 'accepted' && (
                    <div className="proposal-result">
                      <div className="result-indicator">
                        <span className="result-icon">🎯</span>
                        <span className="result-text">Applied to canvas</span>
                      </div>
                    </div>
                  )}

                  {proposal.status === 'rejected' && (
                    <div className="proposal-result">
                      <div className="result-indicator rejected">
                        <span className="result-icon">🚫</span>
                        <span className="result-text">Proposal dismissed</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="timeline-footer">
        <div className="timeline-tip">
          💡 Review and accept agent proposals to update your workspace
        </div>
      </div>
    </div>
  );
};

export default Timeline;
