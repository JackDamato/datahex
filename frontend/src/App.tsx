import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import ProfilePage from './components/ProfilePage'
import ProjectWorkspace from './components/ProjectWorkspace'
import './App.css'

// Stub CedarCopilot component for development
const CedarCopilot: React.FC<{ 
  provider: string; 
  config: { baseUrl: string; apiKey: string }; 
  children: React.ReactNode 
}> = ({ children }) => {
  return <>{children}</>
}

// Main App Content with Simple State-based Navigation
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { state } = useAuth();

  // Show loading while checking authentication
  if (state.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Show appropriate page based on authentication and current page
  if (!state.isAuthenticated) {
    if (currentPage === 'signup') {
      return <SignupPage onNavigate={setCurrentPage} />;
    }
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  // Authenticated user - show appropriate page
  if (currentPage === 'project' && selectedProjectId) {
    return (
      <ProjectWorkspace 
        projectId={selectedProjectId} 
        onBack={() => {
          setCurrentPage('profile');
          setSelectedProjectId(null);
        }} 
      />
    );
  }

  // Default to profile page for authenticated users
  return (
    <ProfilePage 
      onProjectClick={(projectId) => {
        setSelectedProjectId(projectId);
        setCurrentPage('project');
      }}
    />
  );
};

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <CedarCopilot
        provider="mastra"
        config={{
          baseUrl: import.meta.env.VITE_MASTRA_BASE_URL || 'http://localhost:3001',
          apiKey: import.meta.env.VITE_MASTRA_API_KEY || 'stub-key-for-development'
        }}
      >
        <AppContent />
      </CedarCopilot>
    </AuthProvider>
  )
}

export default App