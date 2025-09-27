import React, { useState, useEffect } from 'react';
import { useCedarOS } from '../contexts/CedarOSContext';
import './DatasetVersionManager.css';

interface DatasetVersion {
  id: string;
  projectId: string;
  datasetId: string;
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  filePath: string;
  metadata: {
    rows: number;
    columns: number;
    columns_info: Array<{
      name: string;
      type: string;
      null_count: number;
      unique_count: number;
    }>;
    transformations: Array<{
      agent: string;
      action: string;
      timestamp: string;
      parameters: any;
    }>;
    checksum: string;
  };
  tags: string[];
  isActive: boolean;
}

interface Transformation {
  id: string;
  versionId: string;
  agent: string;
  action: string;
  parameters: any;
  timestamp: string;
  description: string;
  inputChecksum: string;
  outputChecksum: string;
}

interface VersionHistory {
  versions: DatasetVersion[];
  transformations: Transformation[];
  currentVersion: DatasetVersion | null;
}

interface DatasetVersionManagerProps {
  className?: string;
}

const DatasetVersionManager: React.FC<DatasetVersionManagerProps> = ({ className = '' }) => {
  const { projectId, currentDataset } = useCedarOS();
  
  const [versionHistory, setVersionHistory] = useState<VersionHistory | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DatasetVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonVersions, setComparisonVersions] = useState<{
    version1: DatasetVersion | null;
    version2: DatasetVersion | null;
  }>({ version1: null, version2: null });
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Load version history when project or dataset changes
  useEffect(() => {
    if (projectId && currentDataset) {
      loadVersionHistory();
    }
  }, [projectId, currentDataset]);

  const loadVersionHistory = async () => {
    if (!projectId || !currentDataset) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/datasets/${currentDataset.id}/versions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const history = await response.json();
        setVersionHistory(history);
        setSelectedVersion(history.currentVersion);
      }
    } catch (error) {
      console.error('Failed to load version history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToVersion = async (version: number) => {
    if (!projectId || !currentDataset) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/datasets/${currentDataset.id}/versions/${version}/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        await loadVersionHistory(); // Reload to get updated current version
      }
    } catch (error) {
      console.error('Failed to switch version:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadVersion = async (version: DatasetVersion) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/datasets/${currentDataset?.id}/versions/${version.version}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${version.name}_v${version.version}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download version:', error);
    }
  };

  const compareVersions = async () => {
    if (!comparisonVersions.version1 || !comparisonVersions.version2) return;

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/datasets/${currentDataset?.id}/versions/compare`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version1: comparisonVersions.version1.version,
          version2: comparisonVersions.version2.version
        }),
      });

      if (response.ok) {
        const comparison = await response.json();
        setComparisonData(comparison);
        setShowComparison(true);
      }
    } catch (error) {
      console.error('Failed to compare versions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderVersionCard = (version: DatasetVersion) => (
    <div 
      key={version.id} 
      className={`version-card ${version.isActive ? 'active' : ''} ${selectedVersion?.id === version.id ? 'selected' : ''}`}
      onClick={() => setSelectedVersion(version)}
    >
      <div className="version-header">
        <div className="version-info">
          <h4 className="version-name">{version.name}</h4>
          <span className="version-number">v{version.version}</span>
          {version.isActive && <span className="active-badge">Current</span>}
        </div>
        <div className="version-actions">
          <button 
            className="action-btn download-btn"
            onClick={(e) => {
              e.stopPropagation();
              downloadVersion(version);
            }}
            title="Download version"
          >
            ⬇️
          </button>
          <button 
            className="action-btn compare-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (!comparisonVersions.version1) {
                setComparisonVersions(prev => ({ ...prev, version1: version }));
              } else if (!comparisonVersions.version2) {
                setComparisonVersions(prev => ({ ...prev, version2: version }));
              }
            }}
            title="Select for comparison"
          >
            🔍
          </button>
        </div>
      </div>
      
      <div className="version-details">
        <div className="version-stats">
          <div className="stat-item">
            <span className="stat-label">Rows</span>
            <span className="stat-value">{version.metadata.rows.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Columns</span>
            <span className="stat-value">{version.metadata.columns}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Created</span>
            <span className="stat-value">{formatDate(version.createdAt)}</span>
          </div>
        </div>
        
        {version.description && (
          <div className="version-description">
            {version.description}
          </div>
        )}
        
        {version.tags.length > 0 && (
          <div className="version-tags">
            {version.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      
      {version.metadata.transformations.length > 0 && (
        <div className="version-transformations">
          <div className="transformations-header">
            <span className="transformations-label">Transformations ({version.metadata.transformations.length})</span>
          </div>
          <div className="transformations-list">
            {version.metadata.transformations.slice(0, 3).map((transformation, index) => (
              <div key={index} className="transformation-item">
                <span className="transformation-agent">{transformation.agent}</span>
                <span className="transformation-action">{transformation.action}</span>
                <span className="transformation-time">{formatDate(transformation.timestamp)}</span>
              </div>
            ))}
            {version.metadata.transformations.length > 3 && (
              <div className="transformation-more">
                +{version.metadata.transformations.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderComparisonModal = () => {
    if (!showComparison || !comparisonData) return null;

    return (
      <div className="comparison-modal" onClick={() => setShowComparison(false)}>
        <div className="comparison-content" onClick={(e) => e.stopPropagation()}>
          <div className="comparison-header">
            <h3>Version Comparison</h3>
            <button 
              className="close-btn"
              onClick={() => setShowComparison(false)}
            >
              ×
            </button>
          </div>
          
          <div className="comparison-body">
            <div className="comparison-summary">
              <h4>Summary</h4>
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-label">Rows Added</span>
                  <span className="summary-value positive">+{comparisonData.summary.rowsAdded}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Rows Removed</span>
                  <span className="summary-value negative">-{comparisonData.summary.rowsRemoved}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Columns Added</span>
                  <span className="summary-value positive">+{comparisonData.summary.columnsAdded}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Columns Removed</span>
                  <span className="summary-value negative">-{comparisonData.summary.columnsRemoved}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Columns Modified</span>
                  <span className="summary-value neutral">{comparisonData.summary.columnsModified}</span>
                </div>
              </div>
            </div>
            
            <div className="comparison-differences">
              <h4>Detailed Changes</h4>
              <div className="differences-list">
                {comparisonData.differences.map((diff: any, index: number) => (
                  <div key={index} className={`difference-item ${diff.type}`}>
                    <span className="difference-type">{diff.type.toUpperCase()}</span>
                    <span className="difference-field">{diff.field}</span>
                    {diff.oldValue && (
                      <span className="difference-old">Old: {JSON.stringify(diff.oldValue)}</span>
                    )}
                    {diff.newValue && (
                      <span className="difference-new">New: {JSON.stringify(diff.newValue)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!versionHistory) {
    return (
      <div className={`dataset-version-manager ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading version history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`dataset-version-manager ${className}`}>
      <div className="version-manager-header">
        <div className="header-left">
          <h3>📊 Dataset Versions</h3>
          <span className="version-count">{versionHistory.versions.length} versions</span>
        </div>
        <div className="header-actions">
          {comparisonVersions.version1 && comparisonVersions.version2 && (
            <button 
              className="compare-btn"
              onClick={compareVersions}
            >
              Compare Versions
            </button>
          )}
          <button 
            className="refresh-btn"
            onClick={loadVersionHistory}
            disabled={isLoading}
          >
            🔄
          </button>
        </div>
      </div>

      <div className="version-manager-content">
        <div className="versions-list">
          {versionHistory.versions.map(renderVersionCard)}
        </div>

        {selectedVersion && (
          <div className="version-details-panel">
            <div className="details-header">
              <h4>{selectedVersion.name} (v{selectedVersion.version})</h4>
              <button 
                className="switch-btn"
                onClick={() => switchToVersion(selectedVersion.version)}
                disabled={selectedVersion.isActive || isLoading}
              >
                {selectedVersion.isActive ? 'Current' : 'Switch to this version'}
              </button>
            </div>
            
            <div className="details-content">
              <div className="details-section">
                <h5>Dataset Information</h5>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Rows</span>
                    <span className="info-value">{selectedVersion.metadata.rows.toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Columns</span>
                    <span className="info-value">{selectedVersion.metadata.columns}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created</span>
                    <span className="info-value">{formatDate(selectedVersion.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created By</span>
                    <span className="info-value">{selectedVersion.createdBy}</span>
                  </div>
                </div>
              </div>

              {selectedVersion.description && (
                <div className="details-section">
                  <h5>Description</h5>
                  <p>{selectedVersion.description}</p>
                </div>
              )}

              {selectedVersion.tags.length > 0 && (
                <div className="details-section">
                  <h5>Tags</h5>
                  <div className="tags-list">
                    {selectedVersion.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="details-section">
                <h5>Column Information</h5>
                <div className="columns-list">
                  {selectedVersion.metadata.columns_info.map((col, index) => (
                    <div key={index} className="column-item">
                      <span className="column-name">{col.name}</span>
                      <span className="column-type">{col.type}</span>
                      <span className="column-stats">
                        {col.null_count} nulls, {col.unique_count} unique
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {renderComparisonModal()}
    </div>
  );
};

export default DatasetVersionManager;
