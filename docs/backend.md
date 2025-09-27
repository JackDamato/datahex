# Backend Documentation

## Overview

The backend is a Node.js + TypeScript + Express application with Mastra integration, designed to serve as the API layer for the Data Science Copilot platform. It provides RESTful endpoints and streaming capabilities for AI agent orchestration.

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **AI Integration**: Mastra (stub implementation)
- **Development**: Nodemon with ts-node
- **CORS**: Cross-origin resource sharing enabled

## Project Structure

```
backend/
├── src/
│   └── index.ts              # Main application entry point
├── dist/                     # Compiled JavaScript (build output)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── nodemon.json              # Development server configuration
└── .env.example              # Environment variables template
```

## Application Architecture

### Main Application (src/index.ts)

The backend follows a simple Express.js architecture with the following components:

1. **Express App Setup**: Basic Express configuration
2. **Middleware Stack**: CORS, JSON parsing, environment variables
3. **Health Check**: Basic health monitoring endpoint
4. **API Routes**: Chat and streaming endpoints
5. **Server Startup**: Port binding and logging

### Middleware Configuration

```typescript
// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// JSON Parsing
app.use(express.json())

// Environment Variables
dotenv.config()
```

## API Endpoints

### Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Service health monitoring
- **Response**: 
  ```json
  {
    "status": "ok",
    "message": "Data Science Copilot Backend is running"
  }
  ```

### Chat API
- **Endpoint**: `POST /chat`
- **Purpose**: Handle chat messages from frontend
- **Request Body**:
  ```json
  {
    "message": "string",
    "context": {
      "dataset": "optional dataset info",
      "session_id": "optional session identifier"
    }
  }
  ```
- **Response**:
  ```json
  {
    "message": "Hello from backend (stub)",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "status": "success"
  }
  ```

### Streaming Chat API
- **Endpoint**: `POST /chat/stream`
- **Purpose**: Server-Sent Events for real-time responses
- **Request Body**: Same as chat API
- **Response**: Server-Sent Events stream
  ```
  data: {"type": "message", "content": "Hello from backend (stub) - streaming response", "timestamp": "2024-01-01T00:00:00.000Z"}

  data: {"type": "message", "content": "CedarOS-Mastra integration is working!", "timestamp": "2024-01-01T00:00:01.000Z"}

  data: {"type": "done", "content": "Stream complete", "timestamp": "2024-01-01T00:00:02.000Z"}
  ```

## Mastra Integration

### Current Implementation
The backend currently uses a stub implementation of Mastra's `registerApiRoute` function:

```typescript
// Stub implementation of Mastra's registerApiRoute
function registerApiRoute(
  app: express.Application, 
  path: string, 
  config: { 
    method: string; 
    handler: (req: Request, res: Response) => void 
  }
) {
  (app as any)[config.method.toLowerCase()](path, config.handler);
}
```

### Future Mastra Integration
- **Agent Orchestration**: Real Mastra agent management
- **Tool Registration**: Agent-specific tools and capabilities
- **Workflow Management**: Multi-agent coordination
- **State Management**: Agent state persistence

## Error Handling

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request
- **500**: Internal Server Error

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### Error Logging
All errors are logged to console with context:
```typescript
console.error('Chat API error:', error);
console.error('Stream API error:', error);
```

## CORS Configuration

### Allowed Origins
- **Development**: `http://localhost:5173` (Vite dev server)
- **Production**: Configurable via `FRONTEND_URL` environment variable

### CORS Headers
- `Access-Control-Allow-Origin`: Frontend URL
- `Access-Control-Allow-Credentials`: true
- `Vary`: Origin

## Environment Variables

### Configuration
- **PORT**: Server port (default: 3001)
- **FRONTEND_URL**: Allowed CORS origin (default: http://localhost:5173)
- **NODE_ENV**: Environment mode (development/production)

### Environment File
```bash
# .env.example
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Development Workflow

### Available Scripts
```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests (placeholder)
```

### Development Server
- **Tool**: Nodemon with ts-node
- **Watch**: `src/**/*` files with `.ts` and `.json` extensions
- **Auto-restart**: On file changes
- **Port**: 3001 (configurable)

### Build Process
1. **TypeScript Compilation**: `tsc` command
2. **Output Directory**: `dist/`
3. **Source Maps**: Generated for debugging
4. **Declaration Files**: Type definitions included

## TypeScript Configuration

### Compiler Options (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Type Definitions
- **@types/node**: Node.js type definitions
- **@types/express**: Express.js type definitions
- **@types/cors**: CORS middleware type definitions

## Dependencies

### Production Dependencies
```json
{
  "express": "^4.18.2",        // Web framework
  "cors": "^2.8.5",            // CORS middleware
  "dotenv": "^16.3.1"          // Environment variables
}
```

### Development Dependencies
```json
{
  "typescript": "^5.3.2",      // TypeScript compiler
  "@types/node": "^20.10.0",   // Node.js types
  "@types/express": "^4.17.21", // Express types
  "@types/cors": "^2.8.17",    // CORS types
  "ts-node": "^10.9.1",        // TypeScript execution
  "nodemon": "^3.0.2"          // Development server
}
```

## Recent Changes

### Initial Setup
1. **Project Structure**: Created basic Express.js application
2. **TypeScript Configuration**: Set up strict TypeScript compilation
3. **Dependencies**: Installed Express, CORS, and development tools
4. **Scripts**: Added development, build, and start scripts

### API Implementation
1. **Health Check Endpoint**: Basic service monitoring
2. **Chat API**: Stub implementation for chat messages
3. **Streaming API**: Server-Sent Events for real-time responses
4. **CORS Configuration**: Frontend integration setup

### Mastra Integration
1. **Stub Implementation**: Created placeholder for Mastra integration
2. **API Route Registration**: Generic route registration function
3. **Type Safety**: Proper TypeScript types for handlers
4. **Error Handling**: Comprehensive error management

### Development Improvements
1. **Nodemon Configuration**: Auto-restart on file changes
2. **TypeScript Compilation**: Fixed compilation errors
3. **Environment Variables**: Proper configuration management
4. **Build Process**: Production-ready compilation

## Future Enhancements

### Real Mastra Integration
1. **Agent Registration**: Register actual AI agents
2. **Tool Management**: Agent-specific tools and capabilities
3. **Workflow Orchestration**: Multi-agent coordination
4. **State Persistence**: Agent state management

### API Enhancements
1. **Authentication**: JWT or session-based auth
2. **Rate Limiting**: API request throttling
3. **Validation**: Request/response validation
4. **Logging**: Structured logging with Winston
5. **Monitoring**: Health checks and metrics

### Database Integration
1. **Data Storage**: Dataset and model persistence
2. **User Management**: User accounts and projects
3. **Session Management**: Chat session persistence
4. **File Storage**: Dataset and result storage

### Production Features
1. **Docker Support**: Containerization
2. **Load Balancing**: Multiple instance support
3. **Caching**: Redis for session and data caching
4. **Security**: HTTPS, security headers
5. **Monitoring**: APM and error tracking

## Server Configuration

### Port Management
- **Default Port**: 3001
- **Environment Override**: `PORT` environment variable
- **Error Handling**: Graceful port conflict resolution

### Startup Logging
```typescript
app.listen(PORT, () => {
  console.log(`🚀 Data Science Copilot Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/chat`);
  console.log(`🌊 Stream API: http://localhost:${PORT}/chat/stream`);
});
```

## Integration Points

### Frontend Communication
- **Base URL**: `http://localhost:3001`
- **CORS**: Configured for frontend origin
- **API Proxy**: Frontend proxies `/api/*` to backend
- **WebSocket**: Future real-time communication

### Python Sandbox
- **Future Integration**: Will communicate with Python sandbox
- **Data Processing**: Send data for analysis
- **Model Training**: Coordinate with ML agents
- **Result Retrieval**: Get processed results

### External Services
- **Future Integrations**: 
  - Database services
  - File storage (AWS S3, etc.)
  - AI model APIs
  - Monitoring services

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Change PORT environment variable
2. **CORS Errors**: Verify FRONTEND_URL configuration
3. **TypeScript Errors**: Check tsconfig.json and dependencies
4. **Build Failures**: Ensure all dependencies are installed

### Development Tips
1. **Hot Reload**: Nodemon automatically restarts on changes
2. **Type Checking**: Run `npm run build` to check for errors
3. **Environment**: Use `.env` file for local configuration
4. **Logging**: Check console output for debugging information
