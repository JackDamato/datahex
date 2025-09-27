# Frontend Documentation

## Overview

The frontend is a React 18 + Vite + TypeScript application with CedarOS integration, designed as a data science copilot interface. It features a unique three-panel layout optimized for data science workflows.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with Rolldown (experimental)
- **UI Integration**: CedarOS (stub implementation)
- **Styling**: CSS with custom design system
- **State Management**: React hooks with custom hooks
- **Development**: Hot Module Replacement (HMR)

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── ChatPanel.tsx     # Conversational interface
│   │   ├── AgentBrowser.tsx  # AI agent selection
│   │   ├── Canvas.tsx        # Main workspace area
│   │   ├── LiveSummaryStats.tsx # Stats + File browser
│   │   └── README.md         # Component documentation
│   ├── hooks/                # Custom React hooks
│   │   └── useProjectFiles.ts # File management hook
│   ├── assets/               # Static assets
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

The application uses a three-panel layout wrapped in a CedarOS provider:

```tsx
<CedarCopilot provider="mastra" config={...}>
  <div className="app">
    <div className="left-sidebar">     // Chat + Agents
    <div className="center-workspace"> // Main canvas
    <div className="right-sidebar">    // Stats + Files
  </div>
</CedarCopilot>
```

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

## Integration Points

### Backend Communication
- **Health Check**: `GET /health`
- **Chat API**: `POST /chat`
- **Streaming**: `POST /chat/stream`
- **CORS**: Configured for localhost:3001

### CedarOS Integration
- **Provider**: Mastra backend
- **Configuration**: Base URL and API key
- **State Management**: Global state for dataset, stats, charts
- **Future**: Real-time updates and agent orchestration

## Recent Changes

### File Browser Implementation
1. **Added File Browser Section**: Bottom right of LiveSummaryStats component
2. **Created useProjectFiles Hook**: Centralized file state management
3. **File Upload Support**: Drag-and-drop and click-to-upload
4. **File Type Icons**: Visual indicators for different file types
5. **Project Structure**: Support for datasets/, models/, charts/ folders
6. **Responsive Layout**: Proper scrolling and space distribution

### Styling Updates
1. **Right Sidebar Layout**: Flexbox layout for stats + file browser
2. **File Item Styling**: Hover effects, selection states
3. **Upload Zone**: Dashed border, hover animations
4. **File Metadata**: Size, date formatting
5. **Scrollable Areas**: Proper overflow handling

### TypeScript Improvements
1. **Type Safety**: Proper interfaces for all components
2. **Hook Types**: Fully typed custom hooks
3. **Environment Variables**: Fixed Vite env var usage
4. **Build Configuration**: Resolved compilation errors

## Future Enhancements

### Planned Features
- **Real CedarOS Integration**: Replace stub with actual CedarOS
- **File Operations**: Rename, delete, move files
- **Folder Navigation**: Expand/collapse folder structure
- **File Preview**: Quick preview of datasets and charts
- **Drag & Drop**: File reordering and organization
- **Context Menus**: Right-click file operations
- **Real-time Updates**: Live file system updates

### Technical Improvements
- **State Management**: Redux or Zustand for complex state
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Skeleton loaders and progress indicators
- **Accessibility**: ARIA labels and keyboard navigation
- **Testing**: Unit and integration tests
- **Performance**: Code splitting and lazy loading

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
