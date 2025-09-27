# Frontend Documentation

## Overview

The frontend is a React 18 + Vite + TypeScript application with CedarOS integration, designed as a data science copilot interface. It features a unique three-panel layout optimized for data science workflows, complete with user authentication, project management, and dataset handling capabilities.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with Rolldown (experimental)
- **UI Integration**: CedarOS (stub implementation)
- **Styling**: CSS with custom design system
- **State Management**: React Context API with custom hooks
- **Authentication**: JWT-based with localStorage
- **API Communication**: Fetch API with error handling
- **Development**: Hot Module Replacement (HMR)

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── Auth/             # Authentication components
│   │   │   ├── LoginPage.tsx     # User login form
│   │   │   ├── SignupPage.tsx    # User registration form
│   │   │   └── ProfilePage.tsx   # User profile & projects
│   │   ├── Workspace/        # Project workspace components
│   │   │   ├── ProjectWorkspace.tsx # Main project interface
│   │   │   ├── Canvas.tsx         # Data science workspace
│   │   │   ├── ChatPanel.tsx      # Conversational interface
│   │   │   ├── AgentBrowser.tsx   # AI agent selection
│   │   │   └── LiveSummaryStats.tsx # Stats + File browser
│   │   └── README.md         # Component documentation
│   ├── contexts/             # React Context providers
│   │   └── AuthContext.tsx   # Authentication state & API
│   ├── hooks/                # Custom React hooks
│   │   └── useProjectFiles.ts # File management hook
│   ├── utils/                # Utility functions
│   │   └── urlUtils.ts       # URL routing utilities
│   ├── assets/               # Static assets
│   │   └── logo.svg          # DataHex logo
│   ├── App.tsx               # Main application component
│   ├── App.css               # Global styles
│   ├── index.css             # Base styles
│   └── main.tsx              # Application entry point
├── public/                   # Public assets
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Node-specific TS config
├── vite.config.ts            # Vite configuration
└── eslint.config.js          # ESLint configuration
```

## Component Architecture

### Main Layout (App.tsx)

The application uses a state-based navigation system with authentication:

```tsx
<AuthProvider>
  <CedarCopilot provider="mastra" config={...}>
    <AppContent /> // Handles routing and authentication
  </CedarCopilot>
</AuthProvider>
```

**Navigation States:**
- `login` - User login page
- `signup` - User registration page  
- `profile` - User profile with projects list
- `project` - Project workspace (when project selected)

## Authentication System

### AuthContext (contexts/AuthContext.tsx)

Centralized authentication state management using React Context API:

**State Interface:**
```typescript
interface AuthState {
  isAuthenticated: boolean
  user: { userId: string; username: string } | null
  token: string | null
  loading: boolean
}
```

**Key Features:**
- **JWT Token Management**: Automatic token storage in localStorage
- **Persistent Sessions**: Auto-login on app reload
- **API Service**: Centralized backend communication
- **Error Handling**: Comprehensive error management

**API Methods:**
- `login(username, password)` - User authentication
- `signup(username, password)` - User registration
- `logout()` - Clear session and redirect
- `getProfile()` - Fetch user profile and projects
- `createProject(name)` - Create new project
- `deleteProject(projectId)` - Delete project
- `uploadDataset(file, projectId)` - Upload CSV files

### Authentication Components

#### LoginPage Component
- **Purpose**: User authentication interface
- **Features**:
  - Username/password form validation
  - Error message display
  - Loading states during authentication
  - Navigation to signup page
- **Validation**: Client-side form validation
- **Integration**: Connects to `/auth/login` endpoint

#### SignupPage Component
- **Purpose**: User registration interface
- **Features**:
  - Username/password/confirm password form
  - Password strength validation
  - Error message display
  - Loading states during registration
  - Navigation to login page
- **Validation**: Password confirmation and strength checks
- **Integration**: Connects to `/auth/signup` endpoint

#### ProfilePage Component
- **Purpose**: User dashboard with project management
- **Features**:
  - User profile display (username, user ID)
  - Projects grid with click-to-open functionality
  - Create new project modal
  - Upload dataset modal with project selection
  - Project deletion with confirmation
  - Logout functionality
- **State Management**: Local state for modals and project data
- **Integration**: Full CRUD operations for projects and datasets

## Project Management System

### ProjectWorkspace Component

**Purpose**: Main project interface with three-panel layout

**Layout Structure:**
```tsx
<div className="app">
  <div className="left-sidebar">     // Chat + Agents
  <div className="center-workspace"> // Canvas + Project header
  <div className="right-sidebar">    // Stats + File browser
</div>
```

**Key Features:**
- **Project Header**: Project name, back button, delete button
- **Delete Confirmation**: Modal with "Are you sure?" dialog
- **File Browser**: Displays project datasets in right sidebar
- **Responsive Design**: Three-column layout with proper scrolling
- **Error Handling**: Loading states and error messages

**Project Operations:**
- **View Project**: Display project details and datasets
- **Delete Project**: Remove project with confirmation
- **Dataset Management**: View uploaded datasets
- **Navigation**: Back to profile page

### Canvas Component (Updated)

**Purpose**: Data science workspace area

**Features:**
- **Welcome Message**: For empty projects
- **Dataset Display**: Grid of uploaded datasets
- **Feature Overview**: Key capabilities showcase
- **Project Integration**: Receives project ID and datasets as props
- **Responsive Grid**: Auto-sizing dataset cards

**Dataset Cards:**
- Dataset name and statistics (rows × columns)
- Action buttons (Open Explorer, Create Chart)
- Hover effects and visual feedback
- Click handlers for future functionality

### Left Sidebar

#### ChatPanel Component
- **Purpose**: Conversational interface for user interactions
- **Features**:
  - Message history display
  - Input field with send button
  - Stub backend integration
  - Real-time message updates
- **State**: Local React state for messages and input
- **Integration**: Connects to backend `/chat` and `/chat/stream` endpoints

#### AgentBrowser Component
- **Purpose**: Display and selection of AI agents
- **Features**:
  - 6 specialized agents (Cleaner, AnalystEngineer, Visualizer, etc.)
  - Click handlers for agent selection
  - Icon-based visual representation
  - Agent role descriptions
- **Agents**:
  - 🧹 Cleaner: Data cleaning and preprocessing
  - ⚙️ AnalystEngineer: Feature engineering
  - 📊 Visualizer: Chart generation
  - 🔗 CorrelationExpert: Statistical analysis
  - 🤖 Modeler: Machine learning models
  - 💡 Explainer: Result interpretation

### Center Workspace

#### Canvas Component
- **Purpose**: Main data science workspace
- **Features**:
  - Welcome message and feature overview
  - Upload dataset buttons
  - Agent proposal timeline (placeholder)
  - Flexible workspace for data exploration
- **Future**: Will support drag-and-drop windows, dataset viewers, charts

### Right Sidebar

#### LiveSummaryStats Component
- **Purpose**: Live statistics and file management
- **Features**:
  - **Dataset Info**: Rows, columns, missing values
  - **Selected Column Stats**: Mean, median, std dev
  - **Correlation Matrix**: Multi-column relationships
  - **File Browser**: Project file management (NEW!)

## File Browser System

### Features Added
- **File Display**: Shows uploaded datasets, models, charts, folders
- **File Types**: Support for CSV, JSON, Excel files
- **File Icons**: Visual indicators for different file types
- **File Selection**: Click to select, double-click to open
- **File Upload**: Drag-and-drop or click to upload
- **File Metadata**: Size, modification date display
- **Project Structure**: Organized folders for models/ and charts/

### File Management Hook (useProjectFiles.ts)

```typescript
interface ProjectFile {
  id: string
  name: string
  type: 'dataset' | 'model' | 'chart' | 'folder'
  size?: string
  modified: string
  path: string
  children?: ProjectFile[]
}
```

**Hook Functions**:
- `addFile()`: Add new files to project
- `removeFile()`: Remove files from project
- `updateFile()`: Update file metadata
- `uploadFiles()`: Handle file uploads
- `getFileById()`: Retrieve specific file
- `getFilesByType()`: Filter files by type

## Styling System

### CSS Architecture
- **Global Styles**: `index.css` - Reset and base styles
- **Component Styles**: `App.css` - All component styles
- **Design System**: Consistent colors, spacing, typography

### Key Design Principles
- **Clean & Modern**: Productivity-first design
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper contrast and interaction states
- **Consistent**: Unified spacing and color scheme

### Color Palette
- **Primary**: #007bff (Blue)
- **Success**: #28a745 (Green)
- **Warning**: #ffc107 (Yellow)
- **Text**: #495057 (Dark gray)
- **Muted**: #6c757d (Medium gray)
- **Background**: #f8f9fa (Light gray)

## Configuration

### Vite Configuration (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_MASTRA_BASE_URL': JSON.stringify('http://localhost:3001'),
    'process.env.VITE_MASTRA_API_KEY': JSON.stringify('stub-key-for-development'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### TypeScript Configuration
- **Target**: ES2020
- **Module**: CommonJS
- **Strict Mode**: Enabled
- **Path Resolution**: Configured for src/ directory

## Development Workflow

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Server
- **URL**: http://localhost:5173 (or next available port)
- **HMR**: Hot Module Replacement enabled
- **Proxy**: API requests proxied to backend

## API Integration

### Authentication Endpoints
- **POST /auth/signup** - User registration
- **POST /auth/login** - User authentication  
- **POST /auth/logout** - User logout
- **GET /auth/profile** - Get user profile and projects

### Project Management Endpoints
- **POST /projects/create** - Create new project
- **GET /projects** - Get user's projects
- **DELETE /projects/:projectId** - Delete project

### Dataset Management Endpoints
- **POST /uploadDataset** - Upload CSV file to project
- **GET /datasets** - Get project datasets

### Chat & AI Endpoints
- **POST /chat** - Send chat message
- **POST /chat/stream** - Streaming chat responses

### Error Handling
- **HTTP Status Codes**: Proper status code handling
- **Error Messages**: User-friendly error display
- **Loading States**: Visual feedback during API calls
- **Retry Logic**: Automatic retry for failed requests

## Integration Points

### Backend Communication
- **Base URL**: `http://localhost:3001`
- **CORS**: Configured for cross-origin requests
- **Authentication**: JWT Bearer token in headers
- **Content-Type**: JSON for most requests, FormData for uploads

### CedarOS Integration
- **Provider**: Mastra backend
- **Configuration**: Base URL and API key
- **State Management**: Global state for dataset, stats, charts
- **Future**: Real-time updates and agent orchestration

## Recent Changes

### Authentication System Implementation
1. **AuthContext Provider**: Centralized authentication state management
2. **JWT Token Handling**: Automatic token storage and retrieval
3. **Login/Signup Pages**: Complete user authentication interface
4. **Form Validation**: Client-side validation with error handling
5. **Persistent Sessions**: Auto-login on application reload
6. **API Integration**: Full backend communication for auth operations

### Project Management System
1. **ProfilePage Component**: User dashboard with project management
2. **Project CRUD Operations**: Create, read, update, delete projects
3. **Dataset Upload**: CSV file upload with project selection
4. **Project Navigation**: Click-to-open project workspace
5. **State-based Routing**: Simple navigation without URL complexity
6. **Modal Interfaces**: Create project and upload dataset modals

### ProjectWorkspace Redesign
1. **Three-Panel Layout**: Left sidebar, center workspace, right sidebar
2. **Modern UI Design**: Updated with provided App.css styling
3. **Project Header**: Project name, back button, delete functionality
4. **Delete Confirmation**: Modal with "Are you sure?" dialog
5. **File Browser Integration**: Project datasets in right sidebar
6. **Responsive Design**: Proper scrolling and space distribution

### Backend Integration
1. **API Service**: Centralized backend communication
2. **Error Handling**: Comprehensive error management
3. **Loading States**: User feedback during operations
4. **CRUD Endpoints**: Full project and dataset management
5. **Authentication Middleware**: Secure API calls with JWT tokens

### UI/UX Improvements
1. **DataHex Logo**: Professional branding throughout
2. **Consistent Styling**: Unified design system
3. **Loading Animations**: Spinner and loading states
4. **Error Messages**: User-friendly error display
5. **Modal Design**: Clean, accessible modal interfaces
6. **Button States**: Hover, active, and disabled states

### TypeScript Enhancements
1. **Type Safety**: Proper interfaces for all components
2. **Context Types**: Fully typed authentication context
3. **API Types**: Type-safe backend communication
4. **Component Props**: Strict typing for all props
5. **Build Configuration**: Resolved compilation errors

## Key Features

### ✅ Implemented Features
- **User Authentication**: Complete login/signup system with JWT
- **Project Management**: Create, view, and delete projects
- **Dataset Upload**: CSV file upload with project association
- **Project Workspace**: Three-panel layout for data science work
- **File Browser**: View project datasets in organized interface
- **Responsive Design**: Mobile-friendly layout
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during operations
- **Modal Interfaces**: Clean, accessible modal dialogs
- **State Management**: React Context for global state

### 🔄 Current Capabilities
- **User Registration & Login**: Secure authentication system
- **Project CRUD**: Full project lifecycle management
- **Dataset Management**: Upload and view CSV files
- **Project Navigation**: Seamless project switching
- **Delete Confirmation**: Safe project deletion with confirmation
- **Real-time Updates**: Live data updates from backend
- **Professional UI**: Modern, clean interface design

## Future Enhancements

### Planned Features
- **Real CedarOS Integration**: Replace stub with actual CedarOS
- **Advanced File Operations**: Rename, move, organize files
- **Dataset Analysis**: Built-in data exploration tools
- **Chart Generation**: Interactive data visualization
- **AI Agent Integration**: Real AI agent functionality
- **Collaboration**: Multi-user project sharing
- **Version Control**: Project and dataset versioning
- **Export Features**: Download datasets and results

### Technical Improvements
- **State Management**: Redux or Zustand for complex state
- **Error Boundaries**: Comprehensive error handling
- **Loading States**: Skeleton loaders and progress indicators
- **Accessibility**: ARIA labels and keyboard navigation
- **Testing**: Unit and integration tests
- **Performance**: Code splitting and lazy loading
- **PWA Features**: Offline capability and app-like experience

## Dependencies

### Production
- `react`: ^19.1.1
- `react-dom`: ^19.1.1

### Development
- `@vitejs/plugin-react`: ^5.0.3
- `typescript`: ~5.8.3
- `vite`: npm:rolldown-vite@7.1.12
- `eslint`: ^9.36.0

### Note on CedarOS
Currently using a stub implementation of CedarOS. The actual `cedar-os` package is installed but wrapped in a stub component for development purposes.
