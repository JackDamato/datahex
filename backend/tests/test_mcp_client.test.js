/**
 * Jest tests for MCP Client
 * Tests the mcpClient functionality
 */

const { mcpClient } = require('../src/mcpClient');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('MCP Client Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    test('should return health status on success', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          message: 'Python MCP Tool Server is running'
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await mcpClient.healthCheck();

      expect(axios.get).toHaveBeenCalledWith('http://python-sandbox:8080/health');
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error on failure', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(mcpClient.healthCheck()).rejects.toThrow('Sandbox health check failed: Error: Network error');
    });
  });

  describe('getTools', () => {
    test('should return tools list on success', async () => {
      const mockResponse = {
        data: [
          {
            name: 'drop_nulls',
            description: 'Remove rows with null values',
            parameters: { dataset_id: 'string', columns: 'array' }
          },
          {
            name: 'runtime.execute_python',
            description: 'Execute Python code on dataset',
            parameters: { datasetId: 'string', code: 'string' }
          }
        ]
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await mcpClient.getTools();

      expect(axios.get).toHaveBeenCalledWith('http://python-sandbox:8080/mcp/tools');
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error on failure', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(mcpClient.getTools()).rejects.toThrow('Failed to get tools: Error: Network error');
    });
  });

  describe('dropNulls', () => {
    test('should call drop_nulls endpoint with correct parameters', async () => {
      const mockResponse = {
        data: {
          newDatasetId: 'new-uuid-123',
          rows: 5
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const request = {
        dataset_id: 'test-dataset-123',
        columns: ['name', 'age']
      };

      const result = await mcpClient.dropNulls(request);

      expect(axios.post).toHaveBeenCalledWith(
        'http://python-sandbox:8080/mcp/clean/drop_nulls',
        request
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle request without columns', async () => {
      const mockResponse = {
        data: {
          newDatasetId: 'new-uuid-456',
          rows: 3
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const request = {
        dataset_id: 'test-dataset-456'
      };

      const result = await mcpClient.dropNulls(request);

      expect(axios.post).toHaveBeenCalledWith(
        'http://python-sandbox:8080/mcp/clean/drop_nulls',
        request
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('should throw error on failure', async () => {
      const error = new Error('Server error');
      axios.post.mockRejectedValue(error);

      const request = {
        dataset_id: 'test-dataset-123',
        columns: ['name', 'age']
      };

      await expect(mcpClient.dropNulls(request)).rejects.toThrow('Drop nulls failed: Error: Server error');
    });
  });

  describe('executePythonOnDataset', () => {
    test('should call execute_python endpoint with correct parameters', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          newDatasetId: 'new-uuid-789',
          stdout: 'Hello from Python!',
          stderr: '',
          summary: 'Dataset processed successfully'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const request = {
        datasetId: 'test-dataset-789',
        code: 'print("Hello from Python!")'
      };

      const result = await mcpClient.executePythonOnDataset(request);

      expect(axios.post).toHaveBeenCalledWith(
        'http://python-sandbox:8080/mcp/runtime/execute_python',
        request
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle error response', async () => {
      const mockResponse = {
        data: {
          status: 'error',
          newDatasetId: null,
          stdout: '',
          stderr: 'Forbidden import detected: os',
          summary: 'Code validation failed'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const request = {
        datasetId: 'test-dataset-789',
        code: 'import os'
      };

      const result = await mcpClient.executePythonOnDataset(request);

      expect(result.status).toBe('error');
      expect(result.newDatasetId).toBeNull();
      expect(result.stderr).toContain('Forbidden import');
    });

    test('should throw error on network failure', async () => {
      const error = new Error('Network error');
      axios.post.mockRejectedValue(error);

      const request = {
        datasetId: 'test-dataset-789',
        code: 'print("Hello")'
      };

      await expect(mcpClient.executePythonOnDataset(request)).rejects.toThrow('Python dataset execution failed: Error: Network error');
    });
  });

  describe('testConnection', () => {
    test('should return true when health check succeeds', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          message: 'Python MCP Tool Server is running'
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await mcpClient.testConnection();

      expect(result).toBe(true);
    });

    test('should return false when health check fails', async () => {
      const error = new Error('Connection refused');
      axios.get.mockRejectedValue(error);

      const result = await mcpClient.testConnection();

      expect(result).toBe(false);
    });
  });
});
