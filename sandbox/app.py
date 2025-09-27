"""
FastAPI MCP Tool Server

This module provides a FastAPI-based MCP (Model Context Protocol) tool server
for data science operations including cleaning, statistics, plotting, and training.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

# Import tool modules
from tools.cleaning import drop_nulls, get_dataset_info
from tools.runtime import execute_python, execute_python_on_dataset
from tools.stats import compute_summary_stats
from tools.plotgen import generate_plot
from tools.train import train_model
from tools.correlation import analyze_correlations

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
import os
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")

async def resolve_dataset_path(dataset_id: str) -> str:
    """Resolve dataset_id to actual file path by calling backend API."""
    try:
        response = requests.get(f"{BACKEND_URL}/datasets/{dataset_id}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
        
        dataset_info = response.json()
        return dataset_info["path"]
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error resolving dataset: {str(e)}")

# Initialize FastAPI app
app = FastAPI(
    title="Python MCP Tool Server",
    description="Data Science MCP Tool Server with cleaning, stats, plotting, and training capabilities",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class DropNullsRequest(BaseModel):
    dataset_id: str
    columns: Optional[List[str]] = None

class DropNullsResponse(BaseModel):
    newDatasetId: str
    rows: int

class ExecutePythonRequest(BaseModel):
    code: str

class ExecutePythonResponse(BaseModel):
    stdout: str
    stderr: str
    returncode: int

class ExecutePythonOnDatasetRequest(BaseModel):
    datasetId: str
    code: str

class ExecutePythonOnDatasetResponse(BaseModel):
    status: str
    newDatasetId: Optional[str]
    stdout: str
    stderr: str
    summary: str

class SummaryStatsRequest(BaseModel):
    dataset_id: str
    column: str

class SummaryStatsResponse(BaseModel):
    mean: float
    median: float
    std: float
    nullPct: float
    histogram: List[Dict[str, Any]]

class PlotGenerateRequest(BaseModel):
    dataset_id: str
    type: str
    columns: List[str]

class PlotGenerateResponse(BaseModel):
    plotly_json: Dict[str, Any]

class TrainRequest(BaseModel):
    dataset_id: str
    features: List[str]
    target: str
    type: str

class CorrelationAnalysisRequest(BaseModel):
    dataset_id: str
    columns: Optional[List[str]] = None
    analysis_type: str = "comprehensive"

class TrainResponse(BaseModel):
    metrics: Dict[str, float]
    artifactPath: str

class CorrelationAnalysisResponse(BaseModel):
    analysis_type: str
    dataset_info: Dict[str, Any]
    correlation_matrices: Dict[str, Any]
    heatmap_data: Dict[str, Any]
    correlations: Dict[str, List[Dict[str, Any]]]
    trends: Dict[str, Any]
    statistics: Dict[str, Any]
    insights: List[str]
    visualization_data: Dict[str, Any]

class ToolInfo(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Python MCP Tool Server is running"}

# Tools registry endpoint
@app.get("/mcp/tools", response_model=List[ToolInfo])
async def get_tools():
    """Get list of available tools and their parameters."""
    return [
        ToolInfo(
            name="drop_nulls",
            description="Remove rows with null values from dataset",
            parameters={
                "dataset_id": "string",
                "columns": "List[string] (optional)"
            }
        ),
        ToolInfo(
            name="execute_python",
            description="Execute Python code safely in subprocess",
            parameters={
                "code": "string"
            }
        ),
        ToolInfo(
            name="runtime.execute_python",
            description="Execute arbitrary Python code on a dataset df to apply custom operations",
            parameters={
                "datasetId": "string",
                "code": "string"
            }
        ),
        ToolInfo(
            name="summary_stats",
            description="Compute summary statistics for a column",
            parameters={
                "dataset_id": "string",
                "column": "string"
            }
        ),
        ToolInfo(
            name="plot_generate",
            description="Generate Plotly visualization",
            parameters={
                "dataset_id": "string",
                "type": "string (histogram|scatter|heatmap)",
                "columns": "List[string]"
            }
        ),
        ToolInfo(
            name="train_model",
            description="Train machine learning model",
            parameters={
                "dataset_id": "string",
                "features": "List[string]",
                "target": "string",
                "type": "string (regression|classification)"
            }
        ),
        ToolInfo(
            name="correlation.analyze",
            description="Perform comprehensive correlation analysis on a dataset",
            parameters={
                "dataset_id": "string - ID of the dataset to analyze",
                "columns": "array of strings (optional) - Specific columns to analyze",
                "analysis_type": "string - Type of analysis (quick/comprehensive/detailed)"
            }
        )
    ]

# Data cleaning endpoints
@app.post("/mcp/clean/drop_nulls", response_model=DropNullsResponse)
async def drop_nulls_endpoint(request: DropNullsRequest):
    """Remove rows with null values from dataset."""
    try:
        result = drop_nulls(request.dataset_id, request.columns)
        return DropNullsResponse(
            newDatasetId=result["newDatasetId"],
            rows=result["rows"]
        )
    except Exception as e:
        logger.error(f"Error in drop_nulls: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error cleaning data: {str(e)}")

# Runtime execution endpoints
@app.post("/mcp/runtime/execute_python", response_model=ExecutePythonOnDatasetResponse)
async def execute_python_on_dataset_endpoint(request: ExecutePythonOnDatasetRequest):
    """Execute Python code on a dataset with access to pandas DataFrame variable 'df'."""
    try:
        result = execute_python_on_dataset(request.datasetId, request.code)
        return ExecutePythonOnDatasetResponse(
            status=result["status"],
            newDatasetId=result["newDatasetId"],
            stdout=result["stdout"],
            stderr=result["stderr"],
            summary=result["summary"]
        )
    except Exception as e:
        logger.error(f"Error in execute_python_on_dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error executing Python code on dataset: {str(e)}")

# Stub endpoints (return dummy responses)
@app.post("/mcp/stats/summary", response_model=SummaryStatsResponse)
async def summary_stats_endpoint(request: SummaryStatsRequest):
    """Compute summary statistics for a column (STUB)."""
    return SummaryStatsResponse(
        mean=0.0,
        median=0.0,
        std=0.0,
        nullPct=0.0,
        histogram=[]
    )

@app.post("/mcp/plot/generate", response_model=PlotGenerateResponse)
async def plot_generate_endpoint(request: PlotGenerateRequest):
    """Generate Plotly visualization (STUB)."""
    return PlotGenerateResponse(
        plotly_json={"data": [], "layout": {}}
    )

@app.post("/mcp/train", response_model=TrainResponse)
async def train_endpoint(request: TrainRequest):
    """Train machine learning model (STUB)."""
    return TrainResponse(
        metrics={"r2_score": 0.0, "mse": 0.0, "rmse": 0.0, "mae": 0.0},
        artifactPath="stub_artifact.pkl"
    )

@app.post("/mcp/correlation/analyze", response_model=CorrelationAnalysisResponse)
async def correlation_analysis_endpoint(request: CorrelationAnalysisRequest):
    """Perform comprehensive correlation analysis on a dataset."""
    try:
        # Check if dataset_id is a direct file path or needs resolution
        if request.dataset_id.endswith('.csv') or request.dataset_id.endswith('.parquet'):
            # Direct file path
            dataset_path = request.dataset_id
            if not dataset_path.startswith('/'):
                dataset_path = f"/sandbox/{dataset_path}"
        else:
            # Dataset ID - resolve through backend
            dataset_path = await resolve_dataset_path(request.dataset_id)
        
        if not os.path.exists(dataset_path):
            raise HTTPException(status_code=404, detail=f"Dataset file not found: {dataset_path}")
        
        result = analyze_correlations(
            dataset_path,
            request.columns,
            request.analysis_type
        )
        
        return CorrelationAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing correlations: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)