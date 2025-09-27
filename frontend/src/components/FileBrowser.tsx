import React, { useState, useRef } from 'react';
import { useCedarOS, type ProjectFile, type Dataset } from '../contexts/CedarOSContext';
import './FileBrowser.css';

interface FileBrowserProps {
  projectId: string;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ projectId }) => {
  const { 
    fileTree, 
    addFile, 
    removeFile, 
    addCanvasCard, 
    setCurrentDataset,
    currentDataset 
  } = useCedarOS();
  
  // Debug logging
  console.log('FileBrowser - projectId:', projectId);
  console.log('FileBrowser - fileTree:', fileTree);
  console.log('FileBrowser - fileTree length:', fileTree.length);
  
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    models: false,
    charts: false
  });

  // Get file icon based on type
  const getFileIcon = (type: ProjectFile['type']) => {
    switch (type) {
      case 'dataset':
        return '📊';
      case 'chart':
        return '📈';
      case 'model':
        return '🤖';
      case 'image':
        return '🖼️';
      default:
        return '📄';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Toggle category collapse state
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Group files by type
  const groupFilesByType = () => {
    const grouped = {
      models: fileTree.filter(file => file.type === 'model'),
      charts: fileTree.filter(file => file.type === 'chart')
    };
    console.log('FileBrowser: Grouped files:', grouped);
    return grouped;
  };

  // Get category display name
  const getCategoryName = (type: string) => {
    switch (type) {
      case 'models': return 'Models';
      case 'charts': return 'Charts';
      default: return type;
    }
  };

  // Get category icon
  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'models': return '🤖';
      case 'charts': return '📊';
      default: return '📁';
    }
  };


  // Handle file click - open in canvas
  const handleFileClick = (file: ProjectFile) => {
    console.log('FileBrowser: File clicked:', file);
    console.log('FileBrowser: File type:', file.type);
    
    if (file.type === 'dataset') {
      // For datasets, create a dataset table card
      const dataset: Dataset = {
        id: file.id,
        name: file.name,
        rows: file.metadata?.rows || 0,
        columns: file.metadata?.columns || 0,
        filePath: file.filePath,
        columnNames: Array.from({ length: file.metadata?.columns || 0 }, (_, i) => `Column ${i + 1}`),
        data: Array.from({ length: Math.min(50, file.metadata?.rows || 0) }, (_, i) => 
          Array.from({ length: file.metadata?.columns || 0 }, (_, j) => `Sample ${i}-${j}`)
        ),
        createdAt: file.createdAt,
      };
      
      setCurrentDataset(dataset);
      addCanvasCard({
        type: 'dataset',
        title: file.name,
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        width: 600,
        height: 400,
        data: dataset,
        fileId: file.id,
        filePath: file.filePath
      });
    } else if (file.type === 'model') {
      console.log('FileBrowser: Creating model card for:', file.name);
      // Create model card with model-specific content
      addCanvasCard({
        type: 'model',
        title: file.name,
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        width: 500,
        height: 350,
        data: {
          filePath: file.filePath,
          type: file.type,
          modelInfo: file.metadata,
          algorithm: file.metadata?.algorithm || 'Unknown',
          accuracy: file.metadata?.accuracy || 0,
          features: file.metadata?.features || []
        },
        fileId: file.id,
        filePath: file.filePath
      });
    } else if (file.type === 'chart') {
      // Create chart card with chart-specific content
      addCanvasCard({
        type: 'chart',
        title: file.name,
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        width: 500,
        height: 400,
        data: {
          filePath: file.filePath,
          type: file.type,
          chartInfo: file.metadata,
          chartType: file.metadata?.chartType || 'bar',
          dimensions: file.metadata?.dimensions || { width: 800, height: 600 }
        },
        fileId: file.id,
        filePath: file.filePath
      });
    } else if (file.type === 'image') {
      // Create image card
      addCanvasCard({
        type: 'image',
        title: file.name,
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        width: 400,
        height: 300,
        data: {
          filePath: file.filePath,
          type: file.type
        },
        fileId: file.id,
        filePath: file.filePath
      });
    }
  };

  // Handle file download
  const handleFileDownload = async (file: ProjectFile) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed:', await response.text());
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Handle file delete
  const handleFileDelete = async (file: ProjectFile) => {
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}/files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (response.ok) {
        removeFile(file.id);
      } else {
        console.error('Delete failed:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="file-browser">
      <div className="file-browser-header">
        <h3>Project Files</h3>
      </div>

      <div className="file-list">
        {fileTree.length === 0 ? (
          <div className="no-files">
            <div className="no-files-icon">📁</div>
            <p>No files uploaded yet</p>
            <p className="upload-hint">Click Upload to add files to your project</p>
          </div>
        ) : (
          (() => {
            const grouped = groupFilesByType();
            console.log('FileBrowser: Rendering categories:', Object.keys(grouped));
            return Object.entries(grouped).map(([category, files]) => (
              files.length > 0 && (
                <div key={category} className="file-category">
                  <div 
                    className="category-header"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="category-title">
                      <span className="category-icon">{getCategoryIcon(category)}</span>
                      <span className="category-name">{getCategoryName(category)}</span>
                      <span className="file-count">({files.length})</span>
                    </div>
                    <span className={`collapse-icon ${collapsedCategories[category] ? 'collapsed' : 'expanded'}`}>
                      ▼
                    </span>
                  </div>
                  {!collapsedCategories[category] && (
                    <div className="category-files">
                      {files.map((file) => (
                        <div key={file.id} className="file-item">
                          <div className="file-content">
                            <div className="file-icon">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="file-info">
                              <div className="file-name" title={file.name}>
                                {file.name}
                              </div>
                              <div className="file-meta">
                                <span className="file-type">{file.type}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                                {file.metadata?.rows && file.metadata?.columns && (
                                  <span className="file-stats">
                                    {file.metadata.rows} rows × {file.metadata.columns} columns
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="file-actions">
                          <button
                            className="action-btn upload"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileClick(file);
                            }}
                            title="Upload"
                          >
                            <span>Upload</span>
                          </button>

                          <button
                            className="action-btn save"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileDownload(file);
                            }}
                            title="Save"
                          >
                            <span>Save</span>
                          </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            ));
          })()
        )}
      </div>

    </div>
  );
};

export default FileBrowser;
