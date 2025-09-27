import express from 'express';
import { clarificationQueue } from '../mastra/queues/clarificationQueue';

const router = express.Router();

/**
 * Get pending clarifications for a project
 * GET /api/projects/:projectId/clarifications
 */
router.get('/:projectId/clarifications', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`📝 Getting clarifications for project: ${projectId}`);
    
    const clarifications = await clarificationQueue.getForProject(projectId);
    
    res.json({
      success: true,
      clarifications,
      count: clarifications.length
    });
  } catch (error) {
    console.error('❌ Error getting clarifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get clarifications'
    });
  }
});

/**
 * Submit a clarification response
 * POST /api/projects/:projectId/clarifications/reply
 */
router.post('/:projectId/clarifications/reply', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { answer, clarificationId } = req.body;
    
    console.log(`📝 Processing clarification reply for project: ${projectId}`);
    console.log(`💬 Answer: ${answer}`);
    
    // Remove the clarification from the queue
    const clarification = await clarificationQueue.popForProject(projectId);
    
    if (!clarification) {
      return res.status(404).json({
        success: false,
        error: 'No pending clarification found'
      });
    }
    
    // TODO: Re-invoke orchestrator with the clarified query
    // For now, just acknowledge the reply
    res.json({
      success: true,
      message: 'Clarification received',
      clarification: {
        question: clarification.question,
        answer,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Error processing clarification reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process clarification reply'
    });
  }
});

/**
 * Clear all clarifications for a project
 * DELETE /api/projects/:projectId/clarifications
 */
router.delete('/:projectId/clarifications', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`🗑️ Clearing clarifications for project: ${projectId}`);
    
    await clarificationQueue.clearForProject(projectId);
    
    res.json({
      success: true,
      message: 'Clarifications cleared'
    });
  } catch (error) {
    console.error('❌ Error clearing clarifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear clarifications'
    });
  }
});

/**
 * Get all pending clarifications (admin endpoint)
 * GET /api/clarifications
 */
router.get('/', async (req, res) => {
  try {
    const clarifications = await clarificationQueue.getAll();
    
    res.json({
      success: true,
      clarifications,
      count: clarifications.length
    });
  } catch (error) {
    console.error('❌ Error getting all clarifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get clarifications'
    });
  }
});

export default router;
