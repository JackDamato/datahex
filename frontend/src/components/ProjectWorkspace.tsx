import React, { useState, useEffect, useRef } from 'react';
import { CedarOSProvider, useCedarOS } from '../contexts/CedarOSContext';
import { apiService, type Project } from '../contexts/AuthContext';
import ChatPanel from './ChatPanel';
import AgentBrowser from './AgentBrowser';
import ChartCanvas from './ChartCanvas';
import Timeline from './Timeline';
import LiveSummaryStats from './LiveSummaryStats';
import FileBrowser from './FileBrowser';
import ModelingResults from './ModelingResults';
import IntegratedChat from './IntegratedChat';
import DatasetVersionManager from './DatasetVersionManager';
import DemoMode from './DemoMode';
import DarkModeToggle from './DarkModeToggle';
import '../App.css';

interface ProjectWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

const ProjectWorkspaceContent: React.FC<ProjectWorkspaceProps> = ({ projectId, onBack }) => {
  console.log('ProjectWorkspace: Received projectId:', projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Get CedarOS context for dataset and file management
  const { currentDataset, fileTree, setCurrentDataset, setDatasetRows, setDatasetHeaders, setDatasetTypes, removeCanvasCard, canvasCards, loadDataset } = useCedarOS();
  
  // Resize state
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(300);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  
  // Sidebar visibility state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(() => {
    const saved = localStorage.getItem('timelineHeight');
    return saved ? parseInt(saved, 10) : 200;
  });
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);
  
  // Center workspace tab state
  const [activeTab, setActiveTab] = useState<'canvas' | 'modeling' | 'versions' | 'demo'>('canvas');
  
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Toggle functions
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  const toggleTimeline = () => {
    setTimelineOpen(!timelineOpen);
  };

  // Update timeline positioning when sidebars are toggled
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.style.left = leftSidebarOpen ? `${leftSidebarWidth}px` : '0px';
      timelineRef.current.style.right = rightSidebarOpen ? `${rightSidebarWidth}px` : '0px';
    }
  }, [leftSidebarOpen, rightSidebarOpen]);

  // Check if project has any datasets
  const hasDataset = fileTree.some(file => file.type === 'dataset') || currentDataset !== null;
  
  // Check if dataset is currently displayed on canvas
  const hasDatasetOnCanvas = canvasCards.some(card => card.type === 'dataset');
  
  // Handle upload file action
  const handleUploadFile = () => {
    // This would trigger file upload - for now just show alert
    alert('File upload functionality will be implemented');
  };
  
  // Handle display dataset action
  const handleDisplayDataset = async () => {
    if (currentDataset) {
      // Dataset is already loaded, card will be auto-created by Canvas component
      return;
    } else {
      // Load dataset using CedarOS
      try {
        await loadDataset(projectId);
      } catch (error) {
        console.error('Error loading dataset:', error);
        alert('Error loading dataset. Please try again.');
      }
    }
  };

  // Handle data deletion
  const handleDeleteData = () => {
    // Remove all dataset cards from canvas
    const datasetCards = canvasCards.filter(card => card.type === 'dataset');
    datasetCards.forEach(card => removeCanvasCard(card.id));
    
    // Clear all dataset state
    setCurrentDataset(null);
    setDatasetRows([]);
    setDatasetHeaders([]);
    setDatasetTypes({});
    
    alert('Data has been removed from the dashboard');
  };

  // Resize event handlers
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === leftSidebarRef.current?.querySelector('.resize-handle-left')) {
        setIsResizingLeft(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        // Disable transitions during dragging
        if (leftSidebarRef.current) {
          leftSidebarRef.current.style.transition = 'none';
        }
        e.preventDefault();
      } else if (e.target === rightSidebarRef.current?.querySelector('.resize-handle-right')) {
        setIsResizingRight(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        // Disable transitions during dragging
        if (rightSidebarRef.current) {
          rightSidebarRef.current.style.transition = 'none';
        }
        e.preventDefault();
      } else if (e.target === timelineRef.current?.querySelector('.timeline-resize-handle')) {
        console.log('Timeline drag started'); // Debug log
        setIsResizingTimeline(true);
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        // Disable transitions during dragging
        if (timelineRef.current) {
          timelineRef.current.style.transition = 'none';
        }
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft && leftSidebarRef.current) {
        const newWidth = e.clientX;
        const minWidth = 300;
        const maxWidth = 500;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          // Update state and DOM directly for immediate response
          setLeftSidebarWidth(newWidth);
          leftSidebarRef.current.style.width = `${newWidth}px`;
          // Update timeline positioning immediately
          if (timelineRef.current) {
            timelineRef.current.style.left = `${newWidth}px`;
          }
        }
      } else if (isResizingRight && rightSidebarRef.current) {
        const newWidth = window.innerWidth - e.clientX;
        const minWidth = 300;
        const maxWidth = 500;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          // Update state and DOM directly for immediate response
          setRightSidebarWidth(newWidth);
          rightSidebarRef.current.style.width = `${newWidth}px`;
          // Update timeline positioning immediately
          if (timelineRef.current) {
            timelineRef.current.style.right = `${newWidth}px`;
          }
        }
      } else if (isResizingTimeline && timelineRef.current) {
        const newHeight = window.innerHeight - e.clientY;
        const minHeight = 100;
        const maxHeight = Math.min(500, window.innerHeight * 0.8); // 80% of viewport height max
        
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          // Update DOM immediately for instant response (like sidebars)
          timelineRef.current.style.height = `${newHeight}px`;
          // Update state for consistency
          setTimelineHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingTimeline(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Re-enable transitions after dragging
      if (leftSidebarRef.current) {
        leftSidebarRef.current.style.transition = '';
      }
      if (rightSidebarRef.current) {
        rightSidebarRef.current.style.transition = '';
      }
      if (timelineRef.current) {
        timelineRef.current.style.transition = '';
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight, isResizingTimeline]);

  // Save timeline height to localStorage
  useEffect(() => {
    localStorage.setItem('timelineHeight', timelineHeight.toString());
  }, [timelineHeight]);

  // Update timeline positioning when sidebar widths change
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.style.left = leftSidebarOpen ? `${leftSidebarWidth}px` : '0px';
      timelineRef.current.style.right = rightSidebarOpen ? `${rightSidebarWidth}px` : '0px';
    }
  }, [leftSidebarWidth, rightSidebarWidth, leftSidebarOpen, rightSidebarOpen]);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        console.log('Loading project with ID:', projectId); // Debug log
        const profile = await apiService.getProfile();
        console.log('Available projects:', profile.projects); // Debug log
        const foundProject = profile.projects.find((p: Project) => p.projectId === projectId);
        
        if (foundProject) {
          console.log('Found project:', foundProject); // Debug log
          setProject(foundProject);
        } else {
          console.error('Project not found. Available project IDs:', profile.projects.map(p => p.projectId));
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
      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div 
          className={`left-sidebar ${leftSidebarOpen ? 'open' : 'closed'}`}
          ref={leftSidebarRef} 
          style={{ width: leftSidebarOpen ? `${leftSidebarWidth}px` : '0px' }}
        >
          {leftSidebarOpen && (
            <>
              <div className="resize-handle resize-handle-left"></div>
              <button 
                className="sidebar-close-btn left-close"
                onClick={toggleLeftSidebar}
                title="Close sidebar"
              >
                ×
              </button>
              <ChatPanel />
              <AgentBrowser />
            </>
          )}
        </div>

        {/* Left Sidebar Toggle Button (when closed) */}
        {!leftSidebarOpen && (
          <button 
            className="sidebar-toggle-btn left-toggle"
            onClick={toggleLeftSidebar}
            title="Open sidebar"
          >
            ▶
          </button>
        )}
        
         <div 
           className={`center-workspace ${timelineOpen ? 'timeline-open' : 'timeline-closed'}`}
           style={{ 
             paddingBottom: timelineOpen ? `${timelineHeight}px` : '0px',
             transition: 'padding-bottom 0.3s ease'
           }}
         >
          {/* Canvas Header */}
          <div className="canvas-header">
            <div className="header-left">
              <button 
                onClick={onBack}
                className="back-btn"
              >
                ← Back
              </button>
            </div>
            
            <div className="header-center">
              <h1 className="project-title-main">{project?.name || 'Project'}</h1>
            </div>
            
            <div className="header-right">
              <div className="header-actions">
                {!hasDataset ? (
                  <button 
                    onClick={handleUploadFile}
                    className="action-btn primary"
                  >
                    Upload
                  </button>
                ) : hasDatasetOnCanvas ? (
                  <button 
                    onClick={handleDeleteData}
                    className="delete-btn"
                  >
                    Remove Data
                  </button>
                ) : (
                  <button 
                    onClick={handleDisplayDataset}
                    className="action-btn primary"
                  >
                    View Data
                  </button>
                )}
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="delete-btn"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
          
          {/* Center Workspace Tabs */}
          <div className="center-workspace">
            <div className="workspace-tabs">
              <button 
                className={`tab-button ${activeTab === 'canvas' ? 'active' : ''}`}
                onClick={() => setActiveTab('canvas')}
              >
                📊 Canvas
              </button>
              <button 
                className={`tab-button ${activeTab === 'modeling' ? 'active' : ''}`}
                onClick={() => setActiveTab('modeling')}
              >
                🤖 Modeling
              </button>
              <button 
                className={`tab-button ${activeTab === 'versions' ? 'active' : ''}`}
                onClick={() => setActiveTab('versions')}
              >
                📊 Versions
              </button>
              <button 
                className={`tab-button ${activeTab === 'demo' ? 'active' : ''}`}
                onClick={() => setActiveTab('demo')}
              >
                🚀 Demo
              </button>
              <div className="tab-spacer"></div>
              <DarkModeToggle className="header-dark-toggle" />
            </div>
            
            <div className="workspace-content">
              {activeTab === 'canvas' && <ChartCanvas />}
              {activeTab === 'modeling' && <ModelingResults />}
              {activeTab === 'versions' && <DatasetVersionManager />}
              {activeTab === 'demo' && <DemoMode />}
            </div>
          </div>
          
          {/* Canvas Timeline Toggle Button (when closed) */}
          {!timelineOpen && (
            <button 
              className="canvas-timeline-toggle-btn"
              onClick={toggleTimeline}
              title="Open timeline"
            >
              ▲
            </button>
          )}

          {/* Canvas Timeline */}
          <div 
            ref={timelineRef}
            className={`canvas-timeline ${timelineOpen ? 'open' : 'closed'}`}
            style={{ 
              height: timelineOpen ? `${timelineHeight}px` : '0px',
              minHeight: timelineOpen ? '100px' : '0px',
              left: leftSidebarOpen ? `${leftSidebarWidth}px` : '0px',
              right: rightSidebarOpen ? `${rightSidebarWidth}px` : '0px',
              transition: 'none', // Disable all transitions for timeline
              background: isResizingTimeline ? 'transparent' : (timelineOpen ? 'white' : 'transparent')
            }}
          >
            {timelineOpen && (
              <>
                <div className="timeline-resize-handle" title="Drag to resize timeline"></div>
                <button 
                  className="timeline-close-btn"
                  onClick={toggleTimeline}
                  title="Close timeline"
                >
                  ×
                </button>
                <div 
                  className="timeline-content"
                  style={{
                    background: isResizingTimeline ? 'transparent' : 'white'
                  }}
                >
                  <Timeline />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Right Sidebar Toggle Button (when closed) */}
        {!rightSidebarOpen && (
          <button 
            className="sidebar-toggle-btn right-toggle"
            onClick={toggleRightSidebar}
            title="Open sidebar"
          >
            ◀
          </button>
        )}

        {/* Right Sidebar */}
        <div 
          className={`right-sidebar ${rightSidebarOpen ? 'open' : 'closed'}`}
          ref={rightSidebarRef} 
          style={{ width: rightSidebarOpen ? `${rightSidebarWidth}px` : '0px' }}
        >
          {rightSidebarOpen && (
            <>
              <div className="resize-handle resize-handle-right"></div>
              <button 
                className="sidebar-close-btn right-close"
                onClick={toggleRightSidebar}
                title="Close sidebar"
              >
                ×
              </button>
              <LiveSummaryStats />
              <IntegratedChat />
              <FileBrowser projectId={projectId} />
            </>
          )}
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

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = (props) => {
  return (
    <CedarOSProvider projectId={props.projectId}>
      <ProjectWorkspaceContent {...props} />
    </CedarOSProvider>
  );
};

export default ProjectWorkspace;