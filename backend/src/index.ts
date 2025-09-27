import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { 
  initializeDatabase, 
  seedDatabase,
  createProject,
  getProjectsByUserId,
  getProjectById,
  deleteProject,
  createDataset,
  getDatasetsByProjectId,
  getUserProfile,
  createDatasetVersion,
  getDatasetVersionHistory
} from './db';
import { authMiddleware, optionalAuthMiddleware } from './authMiddleware';
import { signupUser, loginUser, AuthUser } from './authServiceSimple';
import { mcpClient } from './mcpClient';

// Stub implementation of Mastra's registerApiRoute
function registerApiRoute(app: express.Application, path: string, config: { method: string; handler: (req: Request, res: Response) => void }) {
  (app as any)[config.method.toLowerCase()](path, config.handler);
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and seed with test data
initializeDatabase()
  .then(() => seedDatabase())
  .catch(console.error);

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}.csv`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Data Science Copilot Backend is running' });
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// Sign up new user
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const result = await signupUser({ username, password });
    
    // Create default project for new user
    await createProject(result.userId, 'My First Project');
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.message === 'Username already exists') {
      return res.status(409).json({ 
        error: error.message,
        code: 'USERNAME_EXISTS'
      });
    }
    
    if (error.message.includes('must be at least')) {
      return res.status(400).json({ 
        error: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SIGNUP_ERROR'
    });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const result = await loginUser({ username, password });
    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid username or password') {
      return res.status(401).json({ 
        error: error.message,
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'LOGIN_ERROR'
    });
  }
});

// Logout user (client-side token invalidation)
app.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user profile with projects and datasets
app.get('/auth/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'PROFILE_ERROR'
    });
  }
});

// ==================== PROJECT ENDPOINTS ====================

// Create new project
app.post('/projects/create', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user!.userId;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Project name is required',
        code: 'MISSING_PROJECT_NAME'
      });
    }
    
    const projectId = await createProject(userId, name.trim());
    const project = await getProjectById(projectId);
    
    res.status(201).json({
      projectId: project.projectId,
      name: project.name,
      createdAt: project.createdAt
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'CREATE_PROJECT_ERROR'
    });
  }
});

// Get user's projects
app.get('/projects', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const projects = await getProjectsByUserId(userId);
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'GET_PROJECTS_ERROR'
    });
  }
});

// Delete project
app.delete('/projects/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.userId;
    
    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required',
        code: 'MISSING_PROJECT_ID'
      });
    }
    
    // Verify project belongs to user
    const project = await getProjectById(projectId);
    if (!project || project.userId !== userId) {
      return res.status(404).json({ 
        error: 'Project not found or access denied',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Delete project (this will cascade delete datasets due to foreign key)
    await deleteProject(projectId);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'DELETE_PROJECT_ERROR'
    });
  }
});

// ==================== DATASET ENDPOINTS ====================

// Upload dataset (now requires projectId)
app.post('/uploadDataset', (req: any, res: any) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ 
        error: 'File upload failed',
        code: 'UPLOAD_ERROR'
      });
    }
    
    // Apply auth middleware manually
    authMiddleware(req, res, async () => {
      try {
        const { projectId } = req.body;
        
        if (!projectId) {
          return res.status(400).json({ 
            error: 'Project ID is required',
            code: 'MISSING_PROJECT_ID'
          });
        }
        
        if (!req.file) {
          return res.status(400).json({ 
            error: 'No file uploaded',
            code: 'NO_FILE'
          });
        }
        
        // Verify project belongs to user
        const project = await getProjectById(projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ 
            error: 'Project not found or access denied',
            code: 'PROJECT_ACCESS_DENIED'
          });
        }
        
        const fileName = req.file.originalname;
        const filePath = `./uploads/${req.file.filename}`;
        
        // For now, return fake row/column counts
        const rows = 100; // TODO: Compute actual row count from CSV
        const columns = 5; // TODO: Compute actual column count from CSV
        
        // Create dataset record
        const datasetId = await createDataset(projectId, fileName, filePath, rows, columns);
        
        const response = {
          datasetId,
          name: fileName,
          rows,
          columns,
          projectId
        };
        
        res.status(201).json(response);
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          code: 'UPLOAD_ERROR'
        });
      }
    });
  });
});

// Get datasets for a specific project
app.get('/projects/:projectId/datasets', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.userId;
    
    // Verify project belongs to user
    const project = await getProjectById(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({ 
        error: 'Project not found or access denied',
        code: 'PROJECT_ACCESS_DENIED'
      });
    }
    
    const datasets = await getDatasetsByProjectId(projectId);
    res.json(datasets);
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'GET_DATASETS_ERROR'
    });
  }
});

// Legacy endpoint for backward compatibility
app.get('/datasets', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Flatten all datasets from all projects
    const allDatasets = profile.projects.flatMap((project: any) => 
      project.datasets.map((dataset: any) => ({
        ...dataset,
        projectName: project.name
      }))
    );
    
    res.json(allDatasets);
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'GET_DATASETS_ERROR'
    });
  }
});

// ==================== CHAT ENDPOINTS ====================

// Register Mastra API routes
registerApiRoute(app, '/chat', {
  method: 'POST',
  handler: async (req: Request, res: Response) => {
    try {
      // Stub response for now
      const response = {
        message: 'Hello from backend (stub)',
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      res.json(response);
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

registerApiRoute(app, '/chat/stream', {
  method: 'POST',
  handler: async (req: Request, res: Response) => {
    try {
      // Set up Server-Sent Events for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:5173',
        'Access-Control-Allow-Credentials': 'true'
      });

      // Send initial message
      res.write(`data: ${JSON.stringify({
        type: 'message',
        content: 'Hello from backend (stub) - streaming response',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Send a few more messages to simulate streaming
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({
          type: 'message',
          content: 'CedarOS-Mastra integration is working!',
          timestamp: new Date().toISOString()
        })}\n\n`);
      }, 1000);

      setTimeout(() => {
        res.write(`data: ${JSON.stringify({
          type: 'done',
          content: 'Stream complete',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      }, 2000);

    } catch (error) {
      console.error('Stream API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ==================== ERROR HANDLING ====================

// ==================== MCP SANDBOX INTEGRATION ====================

// Test sandbox connection
app.get('/mcp/health', async (req, res) => {
  try {
    const health = await mcpClient.healthCheck();
    res.json({
      status: 'ok',
      sandbox: health,
      message: 'Mastra backend connected to Python sandbox'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      error: 'Sandbox connection failed',
      details: error.message
    });
  }
});

// Get available sandbox tools
app.get('/mcp/tools', async (req, res) => {
  try {
    const tools = await mcpClient.getTools();
    res.json({ tools });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get sandbox tools',
      details: error.message
    });
  }
});

// Clean dataset (drop nulls)
app.post('/mcp/clean/drop_nulls', authMiddleware, async (req: any, res) => {
  try {
    const { dataset_id, columns } = req.body;
    
    if (!dataset_id) {
      return res.status(400).json({
        error: 'dataset_id is required',
        code: 'MISSING_DATASET_ID'
      });
    }

    const result = await mcpClient.dropNulls({ dataset_id, columns });
    
    // Create dataset version entry
    if (result.newDatasetId) {
      await createDatasetVersion(
        dataset_id,
        result.newDatasetId,
        'drop_nulls',
        columns ? JSON.stringify(columns) : null,
        req.user.userId
      );
    }
    
    // Log the operation for audit
    console.log(`User ${req.user.userId} cleaned dataset ${dataset_id}, result: ${result.newDatasetId}`);
    
    res.json(result);
  } catch (error: any) {
    console.error('Drop nulls error:', error);
    res.status(500).json({
      error: 'Failed to clean dataset',
      details: error.message
    });
  }
});

// Execute Python code
app.post('/mcp/execute_python', authMiddleware, async (req: any, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: 'code is required',
        code: 'MISSING_CODE'
      });
    }

    const result = await mcpClient.executePython({ code });
    
    // Log the operation for audit
    console.log(`User ${req.user.userId} executed Python code, return code: ${result.returncode}`);
    
    res.json(result);
  } catch (error: any) {
    console.error('Python execution error:', error);
    res.status(500).json({
      error: 'Failed to execute Python code',
      details: error.message
    });
  }
});

// Execute Python code on dataset
app.post('/mcp/execute_python_on_dataset', authMiddleware, async (req: any, res) => {
  try {
    const { datasetId, code } = req.body;
    
    if (!datasetId || !code) {
      return res.status(400).json({
        error: 'datasetId and code are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    const result = await mcpClient.executePythonOnDataset({ datasetId, code });
    
    // Create dataset version entry if new dataset was created
    if (result.newDatasetId) {
      await createDatasetVersion(
        datasetId,
        result.newDatasetId,
        'execute_python',
        JSON.stringify({ code }),
        req.user.userId
      );
    }
    
    // Log the operation for audit
    console.log(`User ${req.user.userId} executed Python on dataset ${datasetId}, new dataset: ${result.newDatasetId}`);
    
    res.json(result);
  } catch (error: any) {
    console.error('Python dataset execution error:', error);
    res.status(500).json({
      error: 'Failed to execute Python code on dataset',
      details: error.message
    });
  }
});

// Get dataset version history
app.get('/mcp/dataset/:datasetId/versions', authMiddleware, async (req: any, res) => {
  try {
    const { datasetId } = req.params;
    
    const versions = await getDatasetVersionHistory(datasetId);
    
    res.json({ versions });
  } catch (error: any) {
    console.error('Get dataset versions error:', error);
    res.status(500).json({
      error: 'Failed to get dataset versions',
      details: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Data Science Copilot Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth signup: http://localhost:${PORT}/auth/signup`);
  console.log(`🔐 Auth login: http://localhost:${PORT}/auth/login`);
  console.log(`🔐 Auth logout: http://localhost:${PORT}/auth/logout`);
  console.log(`👤 Auth profile: http://localhost:${PORT}/auth/profile`);
  console.log(`📁 Create project: http://localhost:${PORT}/projects/create`);
  console.log(`📋 Get projects: http://localhost:${PORT}/projects`);
  console.log(`📁 Upload dataset: http://localhost:${PORT}/uploadDataset`);
  console.log(`📊 Get datasets: http://localhost:${PORT}/datasets`);
  console.log(`💬 Chat API: http://localhost:${PORT}/chat`);
  console.log(`🌊 Stream API: http://localhost:${PORT}/chat/stream`);
  console.log(`🔧 MCP Health: http://localhost:${PORT}/mcp/health`);
  console.log(`🛠️ MCP Tools: http://localhost:${PORT}/mcp/tools`);
  console.log(`🧹 MCP Clean: http://localhost:${PORT}/mcp/clean/drop_nulls`);
  console.log(`🐍 MCP Python: http://localhost:${PORT}/mcp/execute_python`);
});