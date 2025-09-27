/**
 * MCP Client for connecting to Python Sandbox
 * 
 * This service handles communication between the Mastra backend
 * and the Python sandbox running on port 8080.
 */

import axios, { AxiosResponse } from 'axios';

const SANDBOX_BASE_URL = process.env.SANDBOX_URL || 'http://localhost:8080';

export interface DropNullsRequest {
  dataset_id: string;
  columns?: string[];
}

export interface DropNullsResponse {
  newDatasetId: string;
  rows: number;
}

export interface ExecutePythonRequest {
  code: string;
}

export interface ExecutePythonResponse {
  stdout: string;
  stderr: string;
  returncode: number;
}

export interface SandboxHealthResponse {
  status: string;
  message: string;
}

export interface ToolInfo {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = SANDBOX_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if sandbox is healthy
   */
  async healthCheck(): Promise<SandboxHealthResponse> {
    try {
      const response: AxiosResponse<SandboxHealthResponse> = await axios.get(
        `${this.baseUrl}/health`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Sandbox health check failed: ${error}`);
    }
  }

  /**
   * Get available tools from sandbox
   */
  async getTools(): Promise<ToolInfo[]> {
    try {
      const response: AxiosResponse<ToolInfo[]> = await axios.get(
        `${this.baseUrl}/mcp/tools`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get tools: ${error}`);
    }
  }

  /**
   * Clean dataset by removing null values
   */
  async dropNulls(request: DropNullsRequest): Promise<DropNullsResponse> {
    try {
      const response: AxiosResponse<DropNullsResponse> = await axios.post(
        `${this.baseUrl}/mcp/clean/drop_nulls`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Drop nulls failed: ${error}`);
    }
  }

  /**
   * Execute Python code safely in sandbox
   */
  async executePython(request: ExecutePythonRequest): Promise<ExecutePythonResponse> {
    try {
      const response: AxiosResponse<ExecutePythonResponse> = await axios.post(
        `${this.baseUrl}/mcp/runtime/execute_python`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Python execution failed: ${error}`);
    }
  }

  /**
   * Test connection to sandbox
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Sandbox connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();
