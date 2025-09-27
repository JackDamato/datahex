import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import csv from 'csv-parser';
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
  createFile,
  getFilesByProjectId,
  getFileById,
  deleteFile,
  updateFile
} from './db';
import { authMiddleware, optionalAuthMiddleware } from './authMiddleware';
import { signupUser, loginUser, AuthUser } from './authServiceSimple';
import orchestratorRouter from './routes/orchestrator';
import clarificationsRouter from './routes/clarifications';

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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
      createdAt: project.createdAt,
      datasets: [] // Include empty datasets array for new projects
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
        
        // Also create a file record for the new file system API
        const fileId = await createFile(projectId, fileName, 'dataset', req.file.size, filePath);
        
        const response = {
          datasetId,
          fileId,
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

// Get dataset data for a specific project
app.get('/api/projects/:projectId/dataset', authMiddleware, async (req, res) => {
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

    // Get the first dataset file for this project
    const files = await getFilesByProjectId(projectId);
    const datasetFile = files.find(file => file.type === 'dataset');
    
    if (!datasetFile) {
      return res.status(404).json({ 
        error: 'No dataset found for this project',
        code: 'NO_DATASET_FOUND'
      });
    }

    // Read and parse the actual CSV file
    const csvPath = path.resolve(datasetFile.path);
    const allRows: string[][] = [];
    const headers: string[] = [];
    let isFirstRow = true;
    let currentRowIndex = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data: any) => {
          if (isFirstRow) {
            // Extract headers from the first row
            headers.push(...Object.keys(data));
            isFirstRow = false;
            return; // Skip the first row (headers)
          }
          
          // Convert data object to array of values
          const row = headers.map(header => data[header] || '');
          allRows.push(row);
          currentRowIndex++;
        })
        .on('end', () => {
          // Infer column types from first 10 rows
          const types: Record<string, string> = {};
          headers.forEach(header => {
            const sampleValues = allRows.slice(0, Math.min(10, allRows.length)).map(row => row[headers.indexOf(header)]);
            const hasNumbers = sampleValues.some(val => !isNaN(Number(val)) && val !== '');
            const hasDecimals = sampleValues.some(val => val.includes('.') && !isNaN(Number(val)));
            
            if (hasDecimals) {
              types[header] = 'float';
            } else if (hasNumbers) {
              types[header] = 'int';
            } else {
              types[header] = 'string';
            }
          });

          const datasetData = {
            id: datasetFile.id,
            projectId: projectId,
            name: datasetFile.name,
            headers: headers,
            rows: allRows,
            types: types,
            totalRows: allRows.length
          };

          res.json(datasetData);
        })
        .on('error', (error: any) => {
          console.error('CSV parsing error:', error);
          res.status(500).json({ 
            error: 'Failed to parse CSV file',
            code: 'CSV_PARSE_ERROR'
          });
        });
    });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'GET_DATASET_ERROR'
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

// ==================== FILE ENDPOINTS ====================

// Get files for a specific project
app.get('/api/projects/:projectId/files', authMiddleware, async (req, res) => {
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
    
    const files = await getFilesByProjectId(projectId);
    // Map fileId to id and path to filePath for frontend compatibility
    const mappedFiles = files.map(file => ({
      ...file,
      id: file.fileId,
      filePath: file.path
    }));
    res.json(mappedFiles);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'GET_FILES_ERROR'
    });
  }
});

// Create a new file
app.post('/api/projects/:projectId/files', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, type, size, path, metadata } = req.body;
    const userId = req.user!.userId;
    
    // Verify project belongs to user
    const project = await getProjectById(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({ 
        error: 'Project not found or access denied',
        code: 'PROJECT_ACCESS_DENIED'
      });
    }
    
    if (!name || !type || !path) {
      return res.status(400).json({ 
        error: 'Name, type, and path are required',
        code: 'MISSING_FILE_DATA'
      });
    }
    
    if (!['dataset', 'chart', 'model', 'image'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Must be dataset, chart, model, or image',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    const fileId = await createFile(projectId, name, type, size || 0, path, metadata);
    const file = await getFileById(fileId);
    
    res.status(201).json(file);
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'CREATE_FILE_ERROR'
    });
  }
});

// Download a file
app.get('/api/projects/:projectId/files/:fileId/download', authMiddleware, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.user!.userId;
    
    // Verify project belongs to user
    const project = await getProjectById(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({ 
        error: 'Project not found or access denied',
        code: 'PROJECT_ACCESS_DENIED'
      });
    }
    
    const file = await getFileById(fileId);
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    const filePath = path.join(__dirname, '..', file.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found on disk',
        code: 'FILE_NOT_FOUND_ON_DISK'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'DOWNLOAD_FILE_ERROR'
    });
  }
});

// Delete a file
app.delete('/api/projects/:projectId/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.user!.userId;
    
    // Verify project belongs to user
    const project = await getProjectById(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({ 
        error: 'Project not found or access denied',
        code: 'PROJECT_ACCESS_DENIED'
      });
    }
    
    const file = await getFileById(fileId);
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    await deleteFile(fileId);
    
    // Optionally delete the physical file
    const filePath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'DELETE_FILE_ERROR'
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

// ==================== ORCHESTRATOR API ====================

// Mount orchestrator routes
app.use('/api/orchestrator', orchestratorRouter);

// Mount clarifications routes
app.use('/api/projects', clarificationsRouter);

// ==================== ERROR HANDLING ====================

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

// Start server with error handling
const server = app.listen(PORT, () => {
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
});

// Handle port conflicts
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the process using this port.`);
    console.error(`💡 Run: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`💡 Or run: npm run dev:kill`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});