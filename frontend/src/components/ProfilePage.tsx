import React, { useState, useEffect } from 'react';
import { useAuth, apiService, type Project } from '../contexts/AuthContext';
import './ProfilePage.css';

interface ProfilePageProps {
  onProjectClick: (projectId: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onProjectClick }) => {
  const { state, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  // Load user profile and projects
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await apiService.getProfile();
        setProjects(profile.projects || []);
        setError('');
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (state.isAuthenticated) {
      loadProfile();
    }
  }, [state.isAuthenticated]);

  const handleLogout = async () => {
    await logout();
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to project workspace
    onProjectClick(project.projectId);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreatingProject(true);
      const newProject = await apiService.createProject(newProjectName.trim());
      setProjects(prev => [newProject, ...prev]);
      setNewProjectName('');
      setShowCreateProject(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        return;
      }
      setUploadFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedProject) return;

    try {
      setUploading(true);
      setUploadError('');
      const result = await apiService.uploadDataset(uploadFile, selectedProject);
      
      // Update projects state with new dataset
      setProjects(prev => prev.map(project => 
        project.projectId === selectedProject 
          ? {
              ...project,
              datasets: [
                {
                  datasetId: result.datasetId,
                  name: result.name,
                  rows: result.rows,
                  columns: result.columns,
                  createdAt: new Date().toISOString()
                },
                ...project.datasets
              ]
            }
          : project
      ));
      
      // Reset form
      setUploadFile(null);
      setSelectedProject('');
      setShowUploadModal(false);
      
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="user-info">
          <h1>Welcome, {state.user?.username}!</h1>
          <p>Manage your projects and datasets</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="profile-content">
        <div className="projects-section">
          <div className="section-header">
            <h2>Your Projects</h2>
            <button 
              onClick={() => setShowCreateProject(true)}
              className="create-button"
            >
              + New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. Create your first project to get started!</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div 
                  key={project.projectId} 
                  className="project-card"
                  onClick={() => handleProjectClick(project)}
                >
                  <h3>{project.name}</h3>
                  <p className="project-date">Created: {formatDate(project.createdAt)}</p>
                  <p className="dataset-count">
                    {project.datasets.length} dataset{project.datasets.length !== 1 ? 's' : ''}
                  </p>
                  
                  {project.datasets.length > 0 && (
                    <div className="datasets-list">
                      <h4>Datasets:</h4>
                      {project.datasets.map((dataset) => (
                        <div key={dataset.datasetId} className="dataset-item">
                          <span className="dataset-name">{dataset.name}</span>
                          <span className="dataset-info">
                            {dataset.rows} rows × {dataset.columns} columns
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="upload-section">
          <h2>Upload Dataset</h2>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="upload-button"
            disabled={projects.length === 0}
          >
            📁 Upload CSV File
          </button>
          {projects.length === 0 && (
            <p className="upload-hint">Create a project first to upload datasets</p>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  type="text"
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                  disabled={creatingProject}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCreateProject(false)}
                  disabled={creatingProject}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creatingProject || !newProjectName.trim()}
                >
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Upload Dataset</h3>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label htmlFor="projectSelect">Select Project</label>
                <select
                  id="projectSelect"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  required
                  disabled={uploading}
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.projectId} value={project.projectId}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="fileInput">Select CSV File</label>
                <input
                  type="file"
                  id="fileInput"
                  accept=".csv"
                  onChange={handleFileSelect}
                  required
                  disabled={uploading}
                />
                {uploadFile && (
                  <p className="file-selected">Selected: {uploadFile.name}</p>
                )}
              </div>

              {uploadError && <div className="error-message">{uploadError}</div>}

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setSelectedProject('');
                    setUploadError('');
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading || !uploadFile || !selectedProject}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
