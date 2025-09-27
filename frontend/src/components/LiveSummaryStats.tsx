import React from 'react'
import { useProjectFiles } from '../hooks/useProjectFiles'

const LiveSummaryStats: React.FC = () => {
  const { 
    files: projectFiles, 
    selectedFileId, 
    setSelectedFileId, 
    uploadFiles 
  } = useProjectFiles()

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'dataset': return '📊'
      case 'model': return '🤖'
      case 'chart': return '📈'
      case 'folder': return '📁'
      default: return '📄'
    }
  }

  const handleFileClick = (file: any) => {
    setSelectedFileId(file.id)
    console.log('Selected file:', file)
    // TODO: Load file content or navigate to file
  }

  const handleFileDoubleClick = (file: any) => {
    if (file.type === 'folder') {
      console.log('Opening folder:', file.name)
      // TODO: Expand folder or navigate into it
    } else {
      console.log('Opening file:', file.name)
      // TODO: Open file in canvas or new tab
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      try {
        const uploadedFiles = await uploadFiles(files)
        console.log('Files uploaded successfully:', uploadedFiles)
        // TODO: Show success message or update UI
      } catch (error) {
        console.error('Error uploading files:', error)
        // TODO: Show error message
      }
    }
  }

  return (
    <div className="live-summary-stats">
      <h3>Summary Stats</h3>
      <div className="stats-content">
        <div className="stat-group">
          <h4>Dataset Info</h4>
          <div className="stat-item">
            <span className="stat-label">Rows:</span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Columns:</span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Missing Values:</span>
            <span className="stat-value">-</span>
          </div>
        </div>
        
        <div className="stat-group">
          <h4>Selected Column</h4>
          <div className="stat-item">
            <span className="stat-label">Mean:</span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Median:</span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Std Dev:</span>
            <span className="stat-value">-</span>
          </div>
        </div>
        
        <div className="correlation-matrix">
          <h4>Correlations</h4>
          <div className="correlation-placeholder">
            Select multiple columns to see correlations
          </div>
        </div>
      </div>

      {/* File Browser Section */}
      <div className="file-browser">
        <h3>Project Files</h3>
        <div className="file-list">
          {projectFiles.length === 0 ? (
            <div className="no-files">
              <p>No files uploaded yet</p>
              <p className="upload-hint">Upload a dataset to get started</p>
            </div>
          ) : (
            projectFiles.map((file) => (
              <div
                key={file.id}
                className={`file-item ${selectedFileId === file.id ? 'selected' : ''}`}
                onClick={() => handleFileClick(file)}
                onDoubleClick={() => handleFileDoubleClick(file)}
              >
                <div className="file-icon">
                  {getFileIcon(file.type)}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {file.size && <span className="file-size">{file.size}</span>}
                    <span className="file-modified">{file.modified}</span>
                  </div>
                </div>
                <div className="file-actions">
                  <button 
                    className="file-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('More actions for:', file.name)
                    }}
                  >
                    ⋯
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Upload Area */}
        <div className="upload-area">
          <div className="upload-zone">
            <div className="upload-icon">📁</div>
            <p>Drop files here or click to upload</p>
            <input
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              multiple
              className="file-input"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveSummaryStats

