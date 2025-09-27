import React from 'react'

const Canvas: React.FC = () => {
  return (
    <div className="canvas">
      <div className="canvas-header">
        <h2>Data Science Workspace</h2>
        <div className="canvas-actions">
          <button>Upload Dataset</button>
          <button>New Analysis</button>
        </div>
      </div>
      
      <div className="canvas-content">
        <div className="welcome-message">
          <h3>Welcome to Data Science Copilot</h3>
          <p>Upload a dataset to begin your analysis journey with our AI agents.</p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">📁</span>
              <span>Upload CSV, JSON, or Excel files</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🤖</span>
              <span>AI agents handle cleaning and analysis</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Interactive visualizations</span>
            </div>
            <div className="feature">
              <span className="feature-icon">💡</span>
              <span>Explainable AI insights</span>
            </div>
          </div>
        </div>
        
        <div className="agent-proposal-timeline">
          <h4>Agent Proposals</h4>
          <div className="proposals">
            <div className="proposal">
              <span className="proposal-status">Pending</span>
              <span className="proposal-text">No active proposals yet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Canvas

