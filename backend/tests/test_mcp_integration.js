/**
 * Backend integration tests for MCP endpoints
 * Tests the backend routes that call the Python sandbox
 */

const request = require('supertest');
const app = require('../src/index');
const { initializeDatabase, seedDatabase } = require('../src/db');
const { mcpClient } = require('../src/mcpClient');
const path = require('path');
const fs = require('fs');

describe('MCP Integration Tests', () => {
  let authToken;
  let testUserId;
  let testProjectId;
  let testDatasetId;

  beforeAll(async () => {
    // Initialize database
    await initializeDatabase();
    await seedDatabase();
    
    // Get test user credentials
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });
    
    authToken = loginResponse.body.token;
    testUserId = loginResponse.body.user.userId;
    
    // Create test project
    const projectResponse = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project for MCP'
      });
    
    testProjectId = projectResponse.body.projectId;
    
    // Create test dataset
    const datasetResponse = await request(app)
      .post(`/projects/${testProjectId}/datasets`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Dataset for MCP',
        description: 'Test dataset for MCP operations'
      });
    
    testDatasetId = datasetResponse.body.datasetId;
    
    // Create a test parquet file in sandbox uploads
    const uploadsDir = path.join(__dirname, '../sandbox/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create test data
    const testData = {
      name: ['Alice', 'Bob', null, 'Charlie', 'David'],
      age: [25, 30, null, 35, 40],
      salary: [50000, null, 70000, 80000, 90000]
    };
    
    // Write as JSON for now (in real implementation, this would be parquet)
    const testFile = path.join(uploadsDir, `${testDatasetId}.parquet`);
    fs.writeFileSync(testFile, JSON.stringify(testData));
  });

  afterAll(async () => {
    // Cleanup test files
    const uploadsDir = path.join(__dirname, '../sandbox/uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file.endsWith('.parquet') && file.includes('test')) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
  });

  describe('MCP Client Connection', () => {
    test('should connect to sandbox', async () => {
      const isConnected = await mcpClient.testConnection();
      expect(isConnected).toBe(true);
    });

    test('should get available tools', async () => {
      const tools = await mcpClient.getTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('drop_nulls');
      expect(toolNames).toContain('runtime.execute_python');
    });
  });

  describe('Drop Nulls Endpoint', () => {
    test('should clean dataset and create version entry', async () => {
      const response = await request(app)
        .post('/mcp/clean/drop_nulls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dataset_id: testDatasetId,
          columns: ['name', 'age']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('newDatasetId');
      expect(response.body).toHaveProperty('rows');
      expect(typeof response.body.rows).toBe('number');
    });

    test('should return error for missing dataset_id', async () => {
      const response = await request(app)
        .post('/mcp/clean/drop_nulls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          columns: ['name', 'age']
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('MISSING_DATASET_ID');
    });

    test('should return error for invalid dataset', async () => {
      const response = await request(app)
        .post('/mcp/clean/drop_nulls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dataset_id: 'nonexistent_dataset',
          columns: ['name', 'age']
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Execute Python on Dataset Endpoint', () => {
    test('should execute Python code on dataset', async () => {
      const response = await request(app)
        .post('/mcp/execute_python_on_dataset')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          datasetId: testDatasetId,
          code: `
# Add a new column
df['age_group'] = df['age'].apply(lambda x: 'Young' if x < 30 else 'Old' if x < 40 else 'Senior')
print(f"Added age_group column. Shape: {df.shape}")
`
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('newDatasetId');
      expect(response.body).toHaveProperty('stdout');
      expect(response.body).toHaveProperty('stderr');
      expect(response.body).toHaveProperty('summary');
    });

    test('should return error for missing parameters', async () => {
      const response = await request(app)
        .post('/mcp/execute_python_on_dataset')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          datasetId: testDatasetId
          // missing code
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('MISSING_PARAMETERS');
    });

    test('should handle forbidden imports', async () => {
      const response = await request(app)
        .post('/mcp/execute_python_on_dataset')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          datasetId: testDatasetId,
          code: `
import os
print("This should fail")
`
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('error');
      expect(response.body.stderr).toContain('Forbidden import');
    });

    test('should handle read-only operations', async () => {
      const response = await request(app)
        .post('/mcp/execute_python_on_dataset')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          datasetId: testDatasetId,
          code: `
# Just read and analyze data
print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
`
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.newDatasetId).toBeNull(); // No new dataset created
      expect(response.body.stdout).toContain('Dataset shape');
    });
  });

  describe('Dataset Version History', () => {
    test('should get dataset version history', async () => {
      const response = await request(app)
        .get(`/mcp/dataset/${testDatasetId}/versions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('versions');
      expect(Array.isArray(response.body.versions)).toBe(true);
    });
  });

  describe('Authentication', () => {
    test('should require authentication for MCP endpoints', async () => {
      const response = await request(app)
        .post('/mcp/clean/drop_nulls')
        .send({
          dataset_id: testDatasetId,
          columns: ['name', 'age']
        });

      expect(response.status).toBe(401);
    });

    test('should require authentication for execute_python_on_dataset', async () => {
      const response = await request(app)
        .post('/mcp/execute_python_on_dataset')
        .send({
          datasetId: testDatasetId,
          code: 'print("Hello")'
        });

      expect(response.status).toBe(401);
    });
  });
});

// Helper function to create test parquet file
function createTestParquetFile(filePath, data) {
  // In a real implementation, this would create an actual parquet file
  // For now, we'll create a JSON file as a placeholder
  fs.writeFileSync(filePath, JSON.stringify(data));
}
