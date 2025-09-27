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

export interface SummaryStatsResponse {
  mean: number;
  median: number;
  std: number;
  nullPct: number;
  histogram: Array<{
    bin_start: number;
    bin_end: number;
    count: number;
    bin_center: number;
  }>;
}

export interface FeatureEngineeringRequest {
  dataset_id: string;
  operations: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  target_column?: string;
}

export interface FeatureEngineeringResponse {
  newDatasetId: string;
  rows: number;
  columns: number;
  operations_applied: string[];
  feature_importance: Record<string, number>;
  original_shape: string;
  new_shape: string;
}

export interface CorrelationAnalysisRequest {
  dataset_id: string;
  columns?: string[];
  analysis_type?: string;
}

export interface CorrelationAnalysisResponse {
  analysis_type: string;
  dataset_info: {
    original_shape: [number, number];
    clean_shape: [number, number];
    columns_analyzed: string[];
    timestamp: string;
  };
  correlation_matrices: {
    pearson: Record<string, Record<string, number>>;
    spearman: Record<string, Record<string, number>>;
  };
  heatmap_data: {
    columns: string[];
    matrix: number[][];
    colors: Array<Array<{
      value: number;
      intensity: number;
      color: string;
    }>>;
    color_scale: {
      min: number;
      max: number;
      neutral: number;
    };
  };
  correlations: {
    strong: Array<{
      column1: string;
      column2: string;
      correlation: number;
      strength: string;
      direction: string;
      significance: string;
    }>;
    moderate: Array<{
      column1: string;
      column2: string;
      correlation: number;
      strength: string;
      direction: string;
      significance: string;
    }>;
    all_pairs: Array<{
      column1: string;
      column2: string;
      correlation: number;
      strength: string;
      direction: string;
    }>;
  };
  trends: {
    linear_trends: Array<{
      column: string;
      slope: number;
      r_squared: number;
      p_value: number;
      trend: string;
      strength: string;
    }>;
    seasonal_patterns: any[];
    outlier_columns: Array<{
      column: string;
      outlier_count: number;
      outlier_percentage: number;
    }>;
    distribution_shapes: Record<string, {
      skewness: number;
      kurtosis: number;
      shape: string;
    }>;
  };
  statistics: {
    descriptive_stats: Record<string, {
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
      range: number;
      iqr: number;
    }>;
    correlation_summary: {
      max_correlation: number;
      min_correlation: number;
      average_absolute_correlation: number;
      high_correlation_pairs: number;
    };
    data_quality: {
      total_rows: number;
      complete_rows: number;
      missing_data_percentage: number;
      numeric_columns: number;
    };
  };
  insights: string[];
  visualization_data: {
    heatmap_ready: boolean;
    scatter_plots: Array<{
      x_column: string;
      y_column: string;
      correlation: number;
      data_points: number;
      title: string;
    }>;
  };
}

export interface CorrelationReportRequest {
  dataset_id: string;
  columns?: string[];
}

export interface CorrelationReportResponse {
  html_report: string;
  report_path: string;
}

export interface VisualizationRequest {
  dataset_id: string;
  chart_type: string;
  columns: string[];
  options?: Record<string, any>;
}

export interface VisualizationResponse {
  chart_type: string;
  columns_used: string[];
  plotly_json: Record<string, any>;
  png_preview: string;
  metadata: {
    dataset_shape: [number, number];
    generated_at: string;
    chart_title: string;
  };
}

export interface ChartGalleryRequest {
  dataset_id: string;
  columns: string[];
}

export interface ChartGalleryResponse {
  gallery: Record<string, any>;
  available_charts: string[];
  metadata: {
    numeric_columns: string[];
    categorical_columns: string[];
    total_charts: number;
  };
}

export interface ChartRecommendationsRequest {
  dataset_id: string;
  columns: string[];
}

export interface ChartRecommendationsResponse {
  recommendations: Array<{
    chart_type: string;
    reason: string;
    priority: string;
  }>;
}

export interface ModelingRequest {
  dataset_id: string;
  features: string[];
  target: string;
  model_type: string;
  algorithm: string;
  test_size?: number;
  random_state?: number;
  hyperparameters?: Record<string, any>;
}

export interface ModelingResponse {
  model_info: {
    algorithm: string;
    model_type: string;
    features_used: string[];
    target: string;
    train_samples: number;
    test_samples: number;
    feature_count: number;
  };
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    r2_score?: number;
    mean_squared_error?: number;
    mean_absolute_error?: number;
    rmse?: number;
    confusion_matrix?: number[][];
  };
  feature_importance: Record<string, number>;
  cross_validation: {
    scores: number[];
    mean_score: number;
    std_score: number;
    cv_folds: number;
  };
  visualizations: Record<string, string>;
  model_metadata: {
    trained_at: string;
    random_state: number;
    test_size: number;
  };
}

export interface ModelComparisonRequest {
  dataset_id: string;
  features: string[];
  target: string;
  model_type: string;
  algorithms: string[];
}

export interface ModelComparisonResponse {
  results: Record<string, any>;
  comparison_summary: Record<string, any>;
  best_algorithm: string;
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
   * Compute summary statistics for a column
   */
  async summaryStats(request: { dataset_id: string; column: string }): Promise<SummaryStatsResponse> {
    try {
      const response: AxiosResponse<SummaryStatsResponse> = await axios.post(
        `${this.baseUrl}/mcp/stats/summary`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Summary stats failed: ${error}`);
    }
  }

  /**
   * Perform feature engineering operations on a dataset
   */
  async engineerFeatures(request: FeatureEngineeringRequest): Promise<FeatureEngineeringResponse> {
    try {
      const response: AxiosResponse<FeatureEngineeringResponse> = await axios.post(
        `${this.baseUrl}/mcp/features/engineer`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Feature engineering failed: ${error}`);
    }
  }

  /**
   * Perform comprehensive correlation analysis and pattern detection
   */
  async analyzeCorrelations(request: CorrelationAnalysisRequest): Promise<CorrelationAnalysisResponse> {
    try {
      const response: AxiosResponse<CorrelationAnalysisResponse> = await axios.post(
        `${this.baseUrl}/mcp/correlation/analyze`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Correlation analysis failed: ${error}`);
    }
  }

  /**
   * Generate comprehensive correlation analysis HTML report
   */
  async generateCorrelationReport(request: CorrelationReportRequest): Promise<CorrelationReportResponse> {
    try {
      const response: AxiosResponse<CorrelationReportResponse> = await axios.post(
        `${this.baseUrl}/mcp/correlation/report`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Correlation report generation failed: ${error}`);
    }
  }

  /**
   * Generate Plotly chart with PNG preview
   */
  async generateVisualization(request: VisualizationRequest): Promise<VisualizationResponse> {
    try {
      const response: AxiosResponse<VisualizationResponse> = await axios.post(
        `${this.baseUrl}/mcp/visualization/generate`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Visualization generation failed: ${error}`);
    }
  }

  /**
   * Create a gallery of different chart types for the dataset
   */
  async createChartGallery(request: ChartGalleryRequest): Promise<ChartGalleryResponse> {
    try {
      const response: AxiosResponse<ChartGalleryResponse> = await axios.post(
        `${this.baseUrl}/mcp/visualization/gallery`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Chart gallery creation failed: ${error}`);
    }
  }

  /**
   * Get chart type recommendations based on data characteristics
   */
  async getChartRecommendations(request: ChartRecommendationsRequest): Promise<ChartRecommendationsResponse> {
    try {
      const response: AxiosResponse<ChartRecommendationsResponse> = await axios.post(
        `${this.baseUrl}/mcp/visualization/recommendations`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Chart recommendations failed: ${error}`);
    }
  }

  /**
   * Train a machine learning model
   */
  async trainModel(request: ModelingRequest): Promise<ModelingResponse> {
    try {
      const response: AxiosResponse<ModelingResponse> = await axios.post(
        `${this.baseUrl}/mcp/modeling/train`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Model training failed: ${error}`);
    }
  }

  /**
   * Compare multiple machine learning algorithms
   */
  async compareModels(request: ModelComparisonRequest): Promise<ModelComparisonResponse> {
    try {
      const response: AxiosResponse<ModelComparisonResponse> = await axios.post(
        `${this.baseUrl}/mcp/modeling/compare`,
        request
      );
      return response.data;
    } catch (error) {
      throw new Error(`Model comparison failed: ${error}`);
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
