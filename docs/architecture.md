# Data Science Copilot Architecture

## System Overview

The Data Science Copilot is a multi-agent platform that combines CedarOS (frontend) with Mastra (backend) to provide an intelligent data science assistant.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │    Sandbox      │
│   (CedarOS)     │◄──►│   (Mastra)      │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ • Chat Panel    │    │ • API Routes    │    │ • Data Science  │
│ • Agent Browser │    │ • Agent Orchestr│    │ • ML Libraries  │
│ • Canvas        │    │ • Stream API    │    │ • Visualization │
│ • Live Stats    │    │ • CORS Config   │    │ • Analysis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Frontend (React + CedarOS)
- **Technology**: React 18, Vite, TypeScript
- **UI Framework**: CedarOS for AI integration
- **Layout**: Three-panel design (chat, workspace, stats)
- **Communication**: HTTP/SSE to backend APIs

### Backend (Node.js + Mastra)
- **Technology**: Node.js, TypeScript, Express
- **AI Framework**: Mastra for agent orchestration
- **API**: RESTful + Server-Sent Events
- **CORS**: Configured for frontend communication

### Sandbox (Python)
- **Technology**: Python 3.8+, asyncio
- **Libraries**: pandas, numpy, scikit-learn, plotly
- **Purpose**: Secure data science operations
- **Future**: Docker containerization

## Data Flow

1. **User Input**: User types message in chat panel
2. **Frontend**: CedarOS captures input, sends to backend
3. **Backend**: Mastra orchestrates appropriate agents
4. **Agents**: Process request, may call Python sandbox
5. **Sandbox**: Performs data science operations
6. **Response**: Results stream back to frontend
7. **Display**: CedarOS updates UI with results

## Agent Architecture

### Agent Types
1. **Cleaner**: Data cleaning and preprocessing
2. **AnalystEngineer**: Feature engineering
3. **Visualizer**: Chart and plot generation
4. **CorrelationExpert**: Statistical analysis
5. **Modeler**: Machine learning models
6. **Explainer**: Result interpretation

### Agent Communication
- Agents communicate via Mastra's orchestration system
- Each agent can call Python sandbox for operations
- Results are aggregated and streamed to frontend

## Security Considerations

- **Sandbox Isolation**: Python operations run in isolated environment
- **CORS**: Properly configured for frontend access
- **Input Validation**: All inputs validated before processing
- **Future**: Docker containers for complete isolation

## Scalability

- **Horizontal**: Multiple backend instances
- **Vertical**: Agent-specific scaling
- **Caching**: Redis for session management (future)
- **Queue**: Message queue for agent coordination (future)

## Development Environment

- **Monorepo**: Single repository with workspaces
- **Hot Reload**: Frontend and backend development servers
- **TypeScript**: Type safety across all components
- **Linting**: ESLint and Prettier configuration

## Deployment

- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend**: Node.js hosting (Railway, Heroku)
- **Sandbox**: Docker containers (future)
- **Database**: PostgreSQL for persistence (future)
