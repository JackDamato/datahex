import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Stub implementation of Mastra's registerApiRoute
function registerApiRoute(app: express.Application, path: string, config: { method: string; handler: (req: Request, res: Response) => void }) {
  (app as any)[config.method.toLowerCase()](path, config.handler);
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Data Science Copilot Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/chat`);
  console.log(`🌊 Stream API: http://localhost:${PORT}/chat/stream`);
});