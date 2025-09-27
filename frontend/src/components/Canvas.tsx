import React from 'react'
import './Canvas.css'

interface Dataset {
  datasetId: string;
  name: string;
  rows: number;
  columns: number;
  createdAt: string;
}

interface CanvasProps {
  projectId: string;
  datasets: Dataset[];
}

const Canvas: React.FC<CanvasProps> = ({ projectId: _projectId, datasets }) => {
  // projectId is available for future use when implementing project-specific features
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
        {datasets.length === 0 ? (
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
        ) : (
          <div className="datasets-workspace">
            <h3>Project Datasets</h3>
            <div className="datasets-grid">
              {datasets.map((dataset) => (
                <div key={dataset.datasetId} className="dataset-window">
                  <div className="dataset-header">
                    <h4>{dataset.name}</h4>
                    <span className="dataset-stats">
                      {dataset.rows} rows × {dataset.columns} columns
                    </span>
                  </div>
                  <div className="dataset-content">
                    <p>Click to explore this dataset</p>
                    <div className="dataset-actions">
                      <button>Open Explorer</button>
                      <button>Create Chart</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
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

