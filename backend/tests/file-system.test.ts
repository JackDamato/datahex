import * as request from 'supertest';
import { app } from '../src/index';
import { initializeDatabase, createUser, createProject, createFile } from '../src/db';

describe('Project Files System', () => {
  let authToken: string;
  let projectId: string;
  let userId: string;

  beforeAll(async () => {
    // Initialize database
    await initializeDatabase();
    
    // Create test user
    const testUser = await createUser('testuser', 'testpassword');
    userId = testUser.userId;
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    
    authToken = loginResponse.body.token;
    
    // Create test project
    const testProject = await createProject(userId, 'Test Project');
    projectId = testProject.projectId;
  });

  describe('File Upload and Management', () => {
    it('should upload a model file and associate it with project', async () => {
      const modelFile = {
        name: 'linear_regression_model.pkl',
        type: 'model',
        size: 1024,
        path: '/uploads/model.pkl',
        metadata: JSON.stringify({
          algorithm: 'LinearRegression',
          accuracy: 0.85,
          features: ['age', 'income', 'education']
        })
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelFile);

      expect(response.status).toBe(201);
      expect(response.body.fileId).toBeDefined();
      expect(response.body.type).toBe('model');
      expect(response.body.projectId).toBe(projectId);
    });

    it('should upload a chart file and associate it with project', async () => {
      const chartFile = {
        name: 'sales_analysis_chart.png',
        type: 'chart',
        size: 2048,
        path: '/uploads/chart.png',
        metadata: JSON.stringify({
          chartType: 'bar',
          dataSource: 'sales_data.csv',
          dimensions: { width: 800, height: 600 }
        })
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(chartFile);

      expect(response.status).toBe(201);
      expect(response.body.fileId).toBeDefined();
      expect(response.body.type).toBe('chart');
      expect(response.body.projectId).toBe(projectId);
    });

    it('should get all files for a project grouped by type', async () => {
      // Upload multiple files of different types
      const files = [
        { name: 'model1.pkl', type: 'model', size: 1024, path: '/uploads/model1.pkl', metadata: '{}' },
        { name: 'model2.pkl', type: 'model', size: 2048, path: '/uploads/model2.pkl', metadata: '{}' },
        { name: 'chart1.png', type: 'chart', size: 1024, path: '/uploads/chart1.png', metadata: '{}' },
        { name: 'dataset1.csv', type: 'dataset', size: 4096, path: '/uploads/dataset1.csv', metadata: '{}' }
      ];

      for (const file of files) {
        await request(app)
          .post(`/api/projects/${projectId}/files`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(file);
      }

      const response = await request(app)
        .get(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(6); // 2 from previous tests + 4 new ones
      
      // Group files by type
      const filesByType = response.body.files.reduce((acc: any, file: any) => {
        if (!acc[file.type]) acc[file.type] = [];
        acc[file.type].push(file);
        return acc;
      }, {});

      expect(filesByType.model).toHaveLength(3);
      expect(filesByType.chart).toHaveLength(2);
      expect(filesByType.dataset).toHaveLength(1);
    });

    it('should download a file', async () => {
      // First upload a file
      const fileData = {
        name: 'test_download.txt',
        type: 'dataset',
        size: 100,
        path: '/uploads/test.txt',
        metadata: '{}'
      };

      const uploadResponse = await request(app)
        .post(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(fileData);

      const fileId = uploadResponse.body.fileId;

      const response = await request(app)
        .get(`/api/projects/${projectId}/files/${fileId}/download`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should delete a file', async () => {
      // First upload a file
      const fileData = {
        name: 'test_delete.txt',
        type: 'dataset',
        size: 100,
        path: '/uploads/delete_test.txt',
        metadata: '{}'
      };

      const uploadResponse = await request(app)
        .post(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(fileData);

      const fileId = uploadResponse.body.fileId;

      const response = await request(app)
        .delete(`/api/projects/${projectId}/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('File deleted successfully');
    });
  });

  describe('File Type Validation', () => {
    it('should reject invalid file types', async () => {
      const invalidFile = {
        name: 'invalid.exe',
        type: 'executable', // Invalid type
        size: 1024,
        path: '/uploads/invalid.exe',
        metadata: '{}'
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidFile);

      expect(response.status).toBe(400);
    });

    it('should accept all valid file types', async () => {
      const validTypes = ['dataset', 'chart', 'model', 'image'];
      
      for (const type of validTypes) {
        const fileData = {
          name: `test_${type}.${type === 'dataset' ? 'csv' : type === 'model' ? 'pkl' : 'png'}`,
          type,
          size: 1024,
          path: `/uploads/test_${type}`,
          metadata: '{}'
        };

        const response = await request(app)
          .post(`/api/projects/${projectId}/files`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(fileData);

        expect(response.status).toBe(201);
        expect(response.body.type).toBe(type);
      }
    });
  });

  describe('Project Association', () => {
    it('should only return files for the specified project', async () => {
      // Create another project
      const anotherProject = await createProject(userId, 'Another Project');
      
      // Upload file to another project
      await request(app)
        .post(`/api/projects/${anotherProject.projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'other_project_file.csv',
          type: 'dataset',
          size: 1024,
          path: '/uploads/other.csv',
          metadata: '{}'
        });

      // Get files for original project
      const response = await request(app)
        .get(`/api/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should not include files from other project
      const otherProjectFiles = response.body.files.filter((file: any) => 
        file.name === 'other_project_file.csv'
      );
      expect(otherProjectFiles).toHaveLength(0);
    });
  });
});
