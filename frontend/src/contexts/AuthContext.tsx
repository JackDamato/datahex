import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Types
interface User {
  userId: string;
  username: string;
}

interface Project {
  projectId: string;
  name: string;
  createdAt: string;
  datasets: Dataset[];
}

interface Dataset {
  datasetId: string;
  name: string;
  rows: number;
  columns: number;
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string, onSuccess?: () => void) => Promise<boolean>;
  signup: (username: string, password: string, onSuccess?: () => void) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Service
class ApiService {
  private baseUrl = 'http://localhost:3001';
  
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  async signup(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
  }
  
  async login(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
  }
  
  async logout() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  }
  
  async getProfile() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token');
    }
    
    const response = await fetch(`${this.baseUrl}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch profile');
    }
  }
  
  async createProject(name: string) {
    console.log('AuthContext: Creating project with name:', name);
    console.log('AuthContext: Using base URL:', this.baseUrl);
    console.log('AuthContext: Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${this.baseUrl}/api/projects/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    
    console.log('AuthContext: Response status:', response.status);
    console.log('AuthContext: Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('AuthContext: Response data:', data);
      return data;
    } else {
      const error = await response.json();
      console.error('AuthContext: Error response:', error);
      throw new Error(error.error || 'Failed to create project');
    }
  }
  
  async getProjects() {
    const response = await fetch(`${this.baseUrl}/api/projects`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }
  }
  
  async deleteProject(projectId: string) {
    const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  }
  
  async uploadDataset(file: File, projectId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    
    const response = await fetch(`${this.baseUrl}/api/uploadDataset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
  }
}

const apiService = new ApiService();

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');
      
      if (token && userId && username) {
        setState({
          isAuthenticated: true,
          user: { userId, username },
          token,
          loading: false
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string, onSuccess?: () => void): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const data = await apiService.login(username, password);
      
      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      
      setState({
        isAuthenticated: true,
        user: { userId: data.userId, username: data.username },
        token: data.token,
        loading: false
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const signup = async (username: string, password: string, onSuccess?: () => void): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const data = await apiService.signup(username, password);
      
      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      
      setState({
        isAuthenticated: true,
        user: { userId: data.userId, username: data.username },
        token: data.token,
        loading: false
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });
    }
  };

  const checkAuth = (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  };

  const value: AuthContextType = {
    state,
    login,
    signup,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export API service for use in components
export { apiService };
export type { User, Project, Dataset };
