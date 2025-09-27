# Frontend Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the frontend with the extended authentication system and project-based dataset management. The backend now supports full user accounts, JWT authentication, project organization, and secure file uploads.

## Backend API Base URL

```
http://localhost:3001
```

## Authentication Flow

### 1. User Registration (Signup)

#### Frontend Requirements
- **Form Fields**: Username (min 3 chars), Password (min 6 chars)
- **Validation**: Client-side validation before API call
- **Error Handling**: Display appropriate error messages
- **Success Flow**: Auto-login after successful registration

#### API Integration
```typescript
// POST /auth/signup
const signup = async (username: string, password: string) => {
  const response = await fetch('http://localhost:3001/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    const data = await response.json();
    // Store token and user data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    return { success: true, user: data };
  } else {
    const error = await response.json();
    return { success: false, error: error.error };
  }
};
```

#### Error Handling
- **409 Conflict**: Username already exists
- **400 Bad Request**: Invalid input (username too short, password too short)
- **500 Internal Server Error**: Server error

#### Success Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "uuid",
  "username": "newuser"
}
```

### 2. User Login

#### Frontend Requirements
- **Form Fields**: Username, Password
- **Validation**: Basic input validation
- **Error Handling**: Display login errors
- **Success Flow**: Redirect to dashboard/profile

#### API Integration
```typescript
// POST /auth/login
const login = async (username: string, password: string) => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  if (response.ok) {
    const data = await response.json();
    // Store token and user data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('username', data.username);
    return { success: true, user: data };
  } else {
    const error = await response.json();
    return { success: false, error: error.error };
  }
};
```

#### Error Handling
- **401 Unauthorized**: Invalid credentials
- **400 Bad Request**: Missing username/password
- **500 Internal Server Error**: Server error

### 3. User Logout

#### Frontend Requirements
- **Clear Storage**: Remove all stored authentication data
- **Redirect**: Redirect to login page
- **UI Update**: Update navigation/header state

#### API Integration
```typescript
// POST /auth/logout
const logout = async () => {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    await fetch('http://localhost:3001/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  
  // Redirect to login
  window.location.href = '/login';
};
```

### 4. User Profile Page

#### Frontend Requirements
- **Protected Route**: Require authentication
- **User Info Display**: Show username and user ID
- **Projects List**: Display all user projects with datasets
- **Navigation**: Links to project management and dataset upload

#### API Integration
```typescript
// GET /auth/profile
const getProfile = async () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const response = await fetch('http://localhost:3001/auth/profile', {
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
};
```

#### Profile Data Structure
```json
{
  "userId": "uuid",
  "username": "user123",
  "projects": [
    {
      "projectId": "uuid",
      "name": "My First Project",
      "createdAt": "2025-01-01T00:00:00Z",
      "datasets": [
        {
          "datasetId": "uuid",
          "name": "data.csv",
          "rows": 100,
          "columns": 5,
          "createdAt": "2025-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### 5. Project Management

#### Create New Project
```typescript
// POST /projects/create
const createProject = async (name: string) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:3001/projects/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to create project');
  }
};
```

#### List User Projects
```typescript
// GET /projects
const getProjects = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:3001/projects', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to fetch projects');
  }
};
```

### 6. Dataset Upload

#### Frontend Requirements
- **File Input**: CSV file selection
- **Project Selection**: Dropdown to select target project
- **Progress Indicator**: Upload progress feedback
- **Validation**: File type and size validation
- **Success Handling**: Show upload success and redirect

#### API Integration
```typescript
// POST /uploadDataset
const uploadDataset = async (file: File, projectId: string) => {
  const token = localStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  
  const response = await fetch('http://localhost:3001/uploadDataset', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
};
```

#### Upload Response
```json
{
  "datasetId": "uuid",
  "name": "data.csv",
  "rows": 100,
  "columns": 5,
  "projectId": "uuid"
}
```

## Frontend Implementation Steps

### 1. Authentication Context/Store

Create a global authentication state management:

```typescript
// AuthContext.tsx
interface AuthState {
  isAuthenticated: boolean;
  user: {
    userId: string;
    username: string;
  } | null;
  token: string | null;
}

interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}
```

### 2. Protected Routes

Implement route protection:

```typescript
// ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};
```

### 3. API Service Layer

Create a centralized API service:

```typescript
// apiService.ts
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
    // Implementation
  }
  
  async login(username: string, password: string) {
    // Implementation
  }
  
  async getProfile() {
    // Implementation
  }
  
  async createProject(name: string) {
    // Implementation
  }
  
  async getProjects() {
    // Implementation
  }
  
  async uploadDataset(file: File, projectId: string) {
    // Implementation
  }
}
```

### 4. Error Handling

Implement consistent error handling:

```typescript
// errorHandler.ts
const handleApiError = (error: any) => {
  if (error.status === 401) {
    // Unauthorized - redirect to login
    localStorage.clear();
    window.location.href = '/login';
  } else if (error.status === 409) {
    // Conflict - show specific error
    return 'Username already exists';
  } else {
    // Generic error
    return 'An error occurred. Please try again.';
  }
};
```

### 5. Form Validation

Implement client-side validation:

```typescript
// validation.ts
const validateSignup = (username: string, password: string) => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};
```

## UI Components Needed

### 1. Login Page
- Username input field
- Password input field
- Login button
- Link to signup page
- Error message display

### 2. Signup Page
- Username input field
- Password input field
- Confirm password field
- Signup button
- Link to login page
- Error message display

### 3. Profile Page
- User information display
- Projects list with datasets
- Create new project button
- Upload dataset button
- Logout button

### 4. Project Management
- Projects list/grid
- Create project modal/form
- Project details view
- Delete project functionality

### 5. Dataset Upload
- File input (CSV only)
- Project selection dropdown
- Upload progress indicator
- Success/error messages

## State Management

### 1. Authentication State
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}
```

### 2. Projects State
```typescript
interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
}
```

### 3. Datasets State
```typescript
interface DatasetsState {
  datasets: Dataset[];
  currentDataset: Dataset | null;
  uploadProgress: number;
  loading: boolean;
}
```

## Security Considerations

### 1. Token Storage
- Store JWT token in localStorage
- Implement token refresh mechanism
- Clear tokens on logout

### 2. API Security
- Always include Authorization header for protected routes
- Handle 401 responses by redirecting to login
- Validate tokens before making requests

### 3. Input Validation
- Client-side validation for all forms
- Server-side validation error handling
- Sanitize user inputs

## Testing Integration

### 1. Unit Tests
- Test authentication functions
- Test API service methods
- Test form validation

### 2. Integration Tests
- Test complete authentication flow
- Test file upload process
- Test project management

### 3. E2E Tests
- Test user registration and login
- Test dataset upload workflow
- Test project creation and management

## Error Scenarios

### 1. Network Errors
- Handle offline scenarios
- Retry failed requests
- Show appropriate error messages

### 2. Authentication Errors
- Token expiry handling
- Invalid credentials
- Session timeout

### 3. Upload Errors
- File size limits
- Invalid file types
- Network interruptions

## Performance Considerations

### 1. Lazy Loading
- Load projects and datasets on demand
- Implement pagination for large datasets

### 2. Caching
- Cache user profile data
- Cache projects list
- Implement optimistic updates

### 3. File Upload
- Show upload progress
- Implement chunked uploads for large files
- Cancel upload functionality

## Deployment Considerations

### 1. Environment Variables
- API base URL configuration
- JWT secret configuration
- CORS settings

### 2. Build Configuration
- API URL environment variables
- Production vs development settings
- Error handling in production

### 3. Monitoring
- API call monitoring
- Error tracking
- User analytics

## Example Implementation

### Complete Login Component
```typescript
// LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
};

export default LoginPage;
```

This integration guide provides everything needed to connect the frontend with the extended authentication system. The backend is fully ready and tested, so the frontend team can implement these patterns to create a complete user experience.
