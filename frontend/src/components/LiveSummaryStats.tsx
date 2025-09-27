import React, { useState, useEffect } from 'react'
import { useCedarOS } from '../contexts/CedarOSContext'

const LiveSummaryStats: React.FC = () => {
  const { 
    selectedColumns,
    summaryStats,
    correlationMatrix,
    datasetTotalRows,
    datasetHeaders,
    addSelectedColumn,
    removeSelectedColumn,
    setSelectedColumns,
    // WebSocket state
    wsConnectionStatus,
    streamingProgress,
    streamingMessage,
    isStreaming,
    // WebSocket actions
    startCorrelationStreaming,
    startVisualizationStreaming
  } = useCedarOS()

  const [isUpdating, setIsUpdating] = useState(false)

  // Handle column selection
  const handleColumnToggle = (column: string) => {
    if (selectedColumns.includes(column)) {
      removeSelectedColumn(column)
    } else {
      addSelectedColumn(column)
    }
  }

  // Handle correlation analysis with streaming
  const handleCorrelationAnalysis = async () => {
    if (selectedColumns.length < 2) {
      alert('Please select at least 2 columns for correlation analysis');
      return;
    }

    try {
      setIsUpdating(true);
      await startCorrelationStreaming(selectedColumns);
    } catch (error) {
      console.error('Failed to start correlation analysis:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle visualization generation
  const handleVisualizationGeneration = async (chartType: string) => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column for visualization');
      return;
    }

    try {
      setIsUpdating(true);
      await startVisualizationStreaming(chartType, selectedColumns);
    } catch (error) {
      console.error('Failed to start visualization generation:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedColumns.length === datasetHeaders.length) {
      setSelectedColumns([])
    } else {
      setSelectedColumns([...datasetHeaders])
    }
  }

  // Show updating indicator when stats are being fetched
  useEffect(() => {
    if (selectedColumns.length > 0) {
      setIsUpdating(true)
      const timer = setTimeout(() => setIsUpdating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [selectedColumns])

  return (
    <div className="live-summary-stats">
      <div className="stats-header">
        <h3>Live Summary Stats</h3>
        {isUpdating && <div className="updating-indicator">🔄</div>}
      </div>
      
      <div className="stats-content">
        {/* Dataset Info */}
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
            <span className="stat-label">Selected:</span>
            <span className="stat-value">{selectedColumns.length}</span>
          </div>
        </div>

        {/* Column Selection */}
        <div className="stat-group">
          <div className="column-selection-header">
            <h4>Select Columns</h4>
            <button 
              className="select-all-btn"
              onClick={handleSelectAll}
            >
              {selectedColumns.length === datasetHeaders.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="column-list">
            {datasetHeaders.map(column => (
              <div 
                key={column}
                className={`column-item ${selectedColumns.includes(column) ? 'selected' : ''}`}
                onClick={() => handleColumnToggle(column)}
              >
                <span className="column-name">{column}</span>
                {selectedColumns.includes(column) && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>
        </div>
        
        {/* WebSocket Connection Status */}
        <div className="websocket-status">
          <div className={`status-indicator ${wsConnectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {wsConnectionStatus === 'connected' && '🟢 Connected'}
              {wsConnectionStatus === 'connecting' && '🟡 Connecting...'}
              {wsConnectionStatus === 'disconnected' && '🔴 Disconnected'}
              {wsConnectionStatus === 'error' && '❌ Error'}
            </span>
          </div>
        </div>

        {/* Streaming Progress */}
        {isStreaming && (
          <div className="streaming-progress">
            <div className="progress-header">
              <span className="progress-message">{streamingMessage}</span>
              <span className="progress-percentage">{streamingProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${streamingProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Single Column Stats */}
        {selectedColumns.length === 1 && summaryStats && (
          <div className="stat-group">
            <h4>Column: {selectedColumns[0]}</h4>
            <div className="stat-item">
              <span className="stat-label">Mean:</span>
              <span className="stat-value">{summaryStats.mean?.toFixed(2) || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Median:</span>
              <span className="stat-value">{summaryStats.median?.toFixed(2) || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Std Dev:</span>
              <span className="stat-value">{summaryStats.std?.toFixed(2) || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Missing:</span>
              <span className="stat-value">{summaryStats.missingPercentage?.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Unique:</span>
              <span className="stat-value">{summaryStats.unique || '-'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Type:</span>
              <span className="stat-value">{summaryStats.dataType || '-'}</span>
            </div>
          </div>
        )}
        
        {/* Visualization Tools */}
        {selectedColumns.length > 0 && (
          <div className="visualization-tools">
            <div className="tools-header">
              <h4>Visualization Tools</h4>
              <div className="chart-buttons">
                <button 
                  className={`chart-button ${isStreaming ? 'streaming' : ''}`}
                  onClick={() => handleVisualizationGeneration('histogram')}
                  disabled={isStreaming || isUpdating}
                  title="Generate histogram"
                >
                  📊 Histogram
                </button>
                {selectedColumns.length >= 2 && (
                  <button 
                    className={`chart-button ${isStreaming ? 'streaming' : ''}`}
                    onClick={() => handleVisualizationGeneration('scatter')}
                    disabled={isStreaming || isUpdating}
                    title="Generate scatter plot"
                  >
                    📈 Scatter
                  </button>
                )}
                <button 
                  className={`chart-button ${isStreaming ? 'streaming' : ''}`}
                  onClick={() => handleVisualizationGeneration('box')}
                  disabled={isStreaming || isUpdating}
                  title="Generate box plot"
                >
                  📦 Box Plot
                </button>
                {selectedColumns.length >= 2 && (
                  <button 
                    className={`chart-button ${isStreaming ? 'streaming' : ''}`}
                    onClick={() => handleVisualizationGeneration('correlation')}
                    disabled={isStreaming || isUpdating}
                    title="Generate correlation heatmap"
                  >
                    🔥 Heatmap
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Correlation Analysis */}
        {selectedColumns.length > 1 && (
          <div className="correlation-analysis">
            <div className="correlation-header">
              <h4>Correlation Analysis</h4>
              <button 
                className={`correlation-button ${isStreaming ? 'streaming' : ''}`}
                onClick={handleCorrelationAnalysis}
                disabled={isStreaming || isUpdating}
              >
                {isStreaming ? '🔄 Analyzing...' : '🔗 Analyze Correlations'}
              </button>
            </div>
            
            {/* Correlation Matrix */}
            <div className="correlation-matrix">
            {correlationMatrix ? (
              correlationMatrix.error ? (
                <div className="correlation-error">
                  <div className="error-icon">⚠️</div>
                  <div className="error-message">{correlationMatrix.error}</div>
                  <div className="error-hint">Try selecting columns with more numeric data</div>
                </div>
              ) : correlationMatrix.columns.length > 0 ? (
                <div className="matrix-container">
                  <div className="matrix-table">
                    <div className="matrix-header">
                      <div className="matrix-cell header"></div>
                      {correlationMatrix.columns.map(col => (
                        <div key={col} className="matrix-cell header">{col}</div>
                      ))}
                    </div>
                    {correlationMatrix.matrix.map((row, i) => (
                      <div key={i} className="matrix-row">
                        <div className="matrix-cell header">{correlationMatrix.columns[i]}</div>
                        {row.map((value, j) => (
                          <div 
                            key={j} 
                            className={`matrix-cell ${i === j ? 'diagonal' : ''}`}
                            style={{
                              backgroundColor: `rgba(0, 123, 255, ${Math.abs(value) * 0.3 + 0.1})`,
                              color: Math.abs(value) > 0.5 ? 'white' : 'black'
                            }}
                          >
                            {value.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="matrix-legend">
                    <div className="legend-item">
                      <div className="legend-color high"></div>
                      <span>High Correlation (|r| &gt; 0.7)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color medium"></div>
                      <span>Medium Correlation (0.3 &lt; |r| ≤ 0.7)</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color low"></div>
                      <span>Low Correlation (|r| ≤ 0.3)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="correlation-placeholder">
                  <div className="loading-spinner"></div>
                  <span>Calculating correlations...</span>
                </div>
              )
            ) : (
              <div className="correlation-placeholder">
                <div className="loading-spinner"></div>
                <span>Calculating correlations...</span>
              </div>
            )}
            </div>
          </div>
        )}

        {/* No Selection State */}
        {selectedColumns.length === 0 && (
          <div className="no-selection">
            <div className="no-selection-icon">📊</div>
            <p>Select columns to view summary statistics</p>
            <p className="no-selection-hint">Click on column names above to select them</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveSummaryStats

