import React from 'react'
import { useCedarOS } from '../contexts/CedarOSContext'

const LiveSummaryStats: React.FC = () => {
  const { 
    selectedColumn,
    summaryStats,
    datasetTotalRows,
    datasetHeaders
  } = useCedarOS()

  // Upload functionality is handled by FileBrowser component

  return (
    <div className="live-summary-stats">
      <h3>Summary Stats</h3>
      <div className="stats-content">
        <div className="stat-group">
          <h4>Dataset Info</h4>
          <div className="stat-item">
            <span className="stat-label">Rows:</span>
            <span className="stat-value">{datasetTotalRows || '-'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Columns:</span>
            <span className="stat-value">{datasetHeaders?.length || '-'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Missing Values:</span>
            <span className="stat-value">{summaryStats?.missingPercentage ? `${summaryStats.missingPercentage.toFixed(1)}%` : '-'}</span>
          </div>
        </div>
        
        <div className="stat-group">
          <h4>Selected Column: {selectedColumn || 'None'}</h4>
          <div className="stat-item">
            <span className="stat-label">Mean:</span>
            <span className="stat-value">{summaryStats?.mean?.toFixed(2) || '-'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Median:</span>
            <span className="stat-value">{summaryStats?.median?.toFixed(2) || '-'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Std Dev:</span>
            <span className="stat-value">{summaryStats?.stdDev?.toFixed(2) || '-'}</span>
          </div>
        </div>
        
        <div className="correlation-matrix">
          <h4>Correlations</h4>
          <div className="correlation-placeholder">
            Select multiple columns to see correlations
          </div>
        </div>
      </div>

    </div>
  )
}

export default LiveSummaryStats

