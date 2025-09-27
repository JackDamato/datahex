"""
FastAPI MCP Tool Server for Data Science Copilot

This module provides a FastAPI server that exposes MCP (Model Context Protocol) tools
for data cleaning, statistical analysis, plotting, and machine learning training.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import json
from pathlib import Path

from tools.cleaning import drop_nulls
from tools.stats import compute_summary_stats
from tools.plotgen import generate_plot
from tools.train import train_model
from utils.sandbox_runner import run_tool_safely

# Initialize FastAPI app
app = FastAPI(
    title="Data Science Copilot Python Sandbox",
    description="MCP Tool Server for data cleaning, stats, plotting, and ML training",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ToolInfo(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]

class DropNullsRequest(BaseModel):
    dataset_path: str
    columns: Optional[List[str]] = None

class DropNullsResponse(BaseModel):
    newDatasetPath: str
    rows: int
    columns: int
    summary: str

class SummaryStatsRequest(BaseModel):
    dataset_path: str
    column: str

class SummaryStatsResponse(BaseModel):
    mean: float
    median: float
    std: float
    nullPct: float
    histogram: List[Dict[str, Any]]

class PlotRequest(BaseModel):
    dataset_path: str
    type: str  # histogram, scatter, heatmap
    columns: List[str]

class PlotResponse(BaseModel):
    plotly_json: Dict[str, Any]

class TrainRequest(BaseModel):
    dataset_path: str
    features: List[str]
    target: str
    type: str  # classification, regression

class TrainResponse(BaseModel):
    metrics: Dict[str, float]
    artifactPath: str

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify service is running."""
    return {"status": "ok"}

# MCP tools discovery endpoint
@app.get("/mcp/tools")
async def get_mcp_tools():
    """Return list of available MCP tools and their parameters."""
    tools = [
        ToolInfo(
            name="drop_nulls",
            description="Remove rows with null values from dataset",
            parameters={
                "dataset_path": {"type": "string", "description": "Path to the dataset file"},
                "columns": {"type": "array", "description": "Optional list of columns to check for nulls", "required": False}
            }
        ),
        ToolInfo(
            name="summary_stats",
            description="Compute summary statistics for a column",
            parameters={
                "dataset_path": {"type": "string", "description": "Path to the dataset file"},
                "column": {"type": "string", "description": "Name of the column to analyze"}
            }
        ),
        ToolInfo(
            name="generate_plot",
            description="Generate Plotly visualization",
            parameters={
                "dataset_path": {"type": "string", "description": "Path to the dataset file"},
                "type": {"type": "string", "description": "Type of plot: histogram, scatter, heatmap"},
                "columns": {"type": "array", "description": "List of columns to use in the plot"}
            }
        ),
        ToolInfo(
            name="train_model",
            description="Train a machine learning model",
            parameters={
                "dataset_path": {"type": "string", "description": "Path to the dataset file"},
                "features": {"type": "array", "description": "List of feature columns"},
                "target": {"type": "string", "description": "Target column name"},
                "type": {"type": "string", "description": "Model type: classification or regression"}
            }
        )
    ]
    return {"tools": tools}

# Data cleaning endpoints
@app.post("/mcp/clean/drop_nulls", response_model=DropNullsResponse)
async def clean_drop_nulls(request: DropNullsRequest):
    """Remove rows with null values from the dataset."""
    try:
        # Ensure dataset exists
        if not os.path.exists(request.dataset_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")
        
        # Run the cleaning tool safely
        result = await run_tool_safely(
            drop_nulls,
            request.dataset_path,
            request.columns
        )
        
        return DropNullsResponse(
            newDatasetPath=result["newDatasetPath"],
            rows=result["rows"],
            columns=result["columns"],
            summary=result["summary"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing dataset: {str(e)}")

# Statistical analysis endpoints
@app.post("/mcp/stats/summary", response_model=SummaryStatsResponse)
async def get_summary_stats(request: SummaryStatsRequest):
    """Compute summary statistics for a specific column."""
    try:
        # Ensure dataset exists
        if not os.path.exists(request.dataset_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")
        
        # Run the stats tool safely
        result = await run_tool_safely(
            compute_summary_stats,
            request.dataset_path,
            request.column
        )
        
        return SummaryStatsResponse(
            mean=result["mean"],
            median=result["median"],
            std=result["std"],
            nullPct=result["nullPct"],
            histogram=result["histogram"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing statistics: {str(e)}")

# Plotting endpoints
@app.post("/mcp/plot/generate", response_model=PlotResponse)
async def generate_plot_endpoint(request: PlotRequest):
    """Generate a Plotly visualization."""
    try:
        # Ensure dataset exists
        if not os.path.exists(request.dataset_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")
        
        # Validate plot type
        valid_types = ["histogram", "scatter", "heatmap"]
        if request.type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid plot type. Must be one of: {valid_types}"
            )
        
        # Call the plot generation function directly
        result = generate_plot(
            request.dataset_path,
            request.type,
            request.columns
        )
        
        return PlotResponse(plotly_json=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating plot: {str(e)}")

# Machine learning endpoints
@app.post("/mcp/train", response_model=TrainResponse)
async def train_model_endpoint(request: TrainRequest):
    """Train a machine learning model."""
    try:
        # Ensure dataset exists
        if not os.path.exists(request.dataset_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")
        
        # Validate model type
        valid_types = ["classification", "regression"]
        if request.type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model type. Must be one of: {valid_types}"
            )
        
        # Run the training tool safely
        result = await run_tool_safely(
            train_model,
            request.dataset_path,
            request.features,
            request.target,
            request.type
        )
        
        return TrainResponse(
            metrics=result["metrics"],
            artifactPath=result["artifactPath"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with basic information."""
    return {
        "message": "Data Science Copilot Python Sandbox",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "tools": "/mcp/tools",
            "clean": "/mcp/clean/drop_nulls",
            "stats": "/mcp/stats/summary",
            "plot": "/mcp/plot/generate",
            "train": "/mcp/train"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
