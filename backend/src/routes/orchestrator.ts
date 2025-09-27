import express from 'express';
import { OrchestratorAgent } from '../mastra/agents/orchestratorAgent';

const router = express.Router();
const orchestrator = new OrchestratorAgent();

/**
 * POST /orchestrator/:projectId/propose
 * Orchestrator endpoint that takes a projectId and user query,
 * then returns which agent should handle the request next
 */
router.post('/:projectId/propose', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userQuery, priorActions = [] } = req.body;

    // Validate required fields
    if (!userQuery || typeof userQuery !== 'string') {
      return res.status(400).json({ 
        error: 'userQuery is required and must be a string' 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        error: 'projectId is required' 
      });
    }

    console.log(`🎭 Orchestrator API: Processing request for project ${projectId}`);
    console.log(`📝 Query: "${userQuery}"`);

    // Create context (datasetId will be resolved by orchestrator)
    const context = {
      projectId,
      datasetId: '', // Will be resolved by orchestrator from DB
      priorActions,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'api'
      }
    };

    // Call orchestrator agent
    const result = await orchestrator.run(
      { projectId, userQuery, priorActions },
      context
    );

    console.log(`✅ Orchestrator decision: ${result.action}`);

    // Return the orchestration decision
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Orchestrator API error:', error);
    
    // Handle specific error types
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({
        error: 'Project not found',
        details: (error as Error).message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details: (error as Error).message
    });
  }
});

/**
 * GET /orchestrator/agents
 * List available agents for frontend reference
 */
router.get('/agents', (req, res) => {
  const agents = [
    { id: 'cleaner', name: 'Data Cleaner', description: 'Clean data, handle nulls, type conversions' },
    { id: 'analyst', name: 'Data Analyst', description: 'Feature engineering, transformations, statistical analysis' },
    { id: 'visualizer', name: 'Visualizer', description: 'Generate charts, plots, data visualizations' },
    { id: 'correlation', name: 'Correlation Expert', description: 'Find relationships, correlations, trends' },
    { id: 'modeling', name: 'Modeler', description: 'Machine learning models, predictions, training' },
    { id: 'explainer', name: 'Explainer', description: 'Result interpretation, summarization, insights' }
  ];

  res.json({
    success: true,
    data: agents
  });
});

/**
 * GET /orchestrator/:projectId/status
 * Get current project status and dataset info
 */
router.get('/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Query project and dataset info
    const query = `
      SELECT 
        p.name as projectName,
        p.createdAt as projectCreated,
        d.datasetId,
        d.name as datasetName,
        d.path as datasetPath,
        d.rows,
        d.columns,
        d.createdAt as datasetCreated
      FROM projects p
      LEFT JOIN datasets d ON p.projectId = d.projectId
      WHERE p.projectId = ?
    `;
    
    const { queryDatabase } = await import('../db');
    const results = await queryDatabase(query, [projectId]);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    const project = results[0];
    
    res.json({
      success: true,
      data: {
        projectId,
        projectName: project.projectName,
        projectCreated: project.projectCreated,
        dataset: project.datasetId ? {
          datasetId: project.datasetId,
          datasetName: project.datasetName,
          datasetPath: project.datasetPath,
          rows: project.rows,
          columns: project.columns,
          createdAt: project.datasetCreated
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Status API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: (error as Error).message
    });
  }
});

export default router;
