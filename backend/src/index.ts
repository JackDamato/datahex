import "dotenv/config";
import express from "express";
import cors from "cors";
import { router as orchestratorRouter } from "./routes/orchestrator";
import { validateTokenAndGetUser, loginUser, signupUser } from "./authService";
import { createProject, getProjectsByUserId, deleteProject, getUserProfile } from "./db";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/orchestrator", orchestratorRouter);

// Auth endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Login failed' });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const result = await signupUser(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

// Profile endpoint
app.get("/api/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.substring(7);
    const user = await validateTokenAndGetUser(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile with projects and datasets
    const profile = await getUserProfile(user.userId);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Projects endpoints
app.post("/api/projects/create", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.substring(7);
    const user = await validateTokenAndGetUser(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectId = await createProject(user.userId, name.trim());
    
    // Return the full project object
    const project = {
      projectId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      datasets: []
    };
    
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.substring(7);
    const user = await validateTokenAndGetUser(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const projects = await getProjectsByUserId(user.userId);
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
});

app.delete("/api/projects/:projectId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }

    const token = authHeader.substring(7);
    const user = await validateTokenAndGetUser(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { projectId } = req.params;
    await deleteProject(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Data Science Copilot Backend is running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Data Science Copilot Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      orchestrator: "/api/orchestrator",
      auth: {
        login: "/api/auth/login",
        signup: "/api/auth/signup"
      },
      profile: "/api/profile",
      projects: {
        create: "/api/projects/create",
        list: "/api/projects",
        delete: "/api/projects/:projectId"
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Data Science Copilot Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - POST /api/orchestrator/orchestrate`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/signup`);
  console.log(`   - GET /api/profile`);
  console.log(`   - POST /api/projects/create`);
  console.log(`   - GET /api/projects`);
  console.log(`   - DELETE /api/projects/:projectId`);
  console.log(`   - GET /health`);
});

export default app;