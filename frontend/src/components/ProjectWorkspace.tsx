import React, { useState, useEffect } from 'react';
import { apiService, type Project } from '../contexts/AuthContext';
import ChatPanel from './ChatPanel';
import AgentBrowser from './AgentBrowser';
import Canvas from './Canvas';
import LiveSummaryStats from './LiveSummaryStats';
import logo from '../assets/logo.svg';
import '../App.css';

interface ProjectWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const profile = await apiService.getProfile();
        const foundProject = profile.projects.find((p: Project) => p.projectId === projectId);
        
        if (foundProject) {
          setProject(foundProject);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleDeleteProject = async () => {
    if (!project) return;
    
    setDeleting(true);
    try {
      await apiService.deleteProject(project.projectId);
      onBack(); // Navigate back to profile after successful deletion
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="center-workspace" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>Loading project workspace...</div>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="app">
        <div className="center-workspace" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Error</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{error || 'Project not found'}</p>
            <button 
              onClick={onBack} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ← Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="left-sidebar">
        <div className="app-header">
          <img src={logo} alt="DataHex" className="app-logo" />
          <h1>DataHex</h1>
        </div>
        <ChatPanel />
        <AgentBrowser />
      </div>
      
      <div className="center-workspace">
        <div className="canvas-header">
          <div className="logo-container">
            <button 
              onClick={onBack}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >
              ← Back
            </button>
            <h2>{project.name}</h2>
          </div>
          <div className="canvas-actions">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Delete Project
            </button>
          </div>
        </div>
        <Canvas projectId={projectId} datasets={project.datasets} />
      </div>
      
      <div className="right-sidebar">
        <LiveSummaryStats />
        <div className="file-browser">
          <h3>Project Files</h3>
          <div className="file-list">
            {project.datasets.map((dataset) => (
              <div key={dataset.datasetId} className="file-item">
                <div className="file-icon">📊</div>
                <div className="file-info">
                  <div className="file-name">{dataset.name}</div>
                  <div className="file-meta">
                    <span className="file-size">{dataset.rows} rows × {dataset.columns} columns</span>
                  </div>
                </div>
              </div>
            ))}
            {project.datasets.length === 0 && (
              <div className="no-files">
                <p>No datasets uploaded yet</p>
                <p className="upload-hint">Upload a CSV file to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, color: '#dc3545', marginBottom: '15px' }}>Delete Project</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will also delete all associated datasets.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspace;
