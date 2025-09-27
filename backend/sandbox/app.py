"""
FastAPI MCP Tool Server

A FastAPI-based MCP (Model Context Protocol) tool server for data science operations:
dataset registration, cleaning, data engineering, statistics, visualization, correlation,
and AI modeling.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import os
import hashlib
import shutil
import pandas as pd

# ---- Tool modules ----
from tools.cleaning import drop_nulls, get_dataset_info
from tools.runtime import execute_python_on_dataset
from tools.stats import compute_summary_stats
from tools.data_engineering import engineer_data  # Make sure this module and function exist per your codebase
from tools.cor import (
    analyze_correlations,
    create_correlation_report,
    create_test_correlation_dataset,
)
from tools.visualization import (
    generate_plotly_chart,
    create_chart_gallery,
    get_chart_recommendations,
    create_test_visualization_dataset,
)
from tools.modeling import (
    train_model as train_ml_model,
    hyperparameter_tuning,
    model_comparison,
    get_model_recommendations,
    create_test_modeling_dataset,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Python MCP Tool Server",
    description="Data Science MCP Tool Server with cleaning, data engineering, stats, visualization, correlation, and modeling",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directory for registered datasets
UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# -----------------------------
# Request/Response Models
# -----------------------------

class RegisterDatasetRequest(BaseModel):
    project_id: str
    csv_path: str  # Prefer absolute path

class RegisterDatasetResponse(BaseModel):
    dataset_id: str
    rows: int
    columns: int
    path: str

class DatasetInfoRequest(BaseModel):
    dataset_id: str

class DatasetInfoResponse(BaseModel):
    rows: int
    columns: int
    dtypes: Dict[str, Any]

class DropNullsRequest(BaseModel):
    dataset_id: str
    columns: Optional[List[str]] = None

class DropNullsResponse(BaseModel):
    newDatasetId: str
    rows: int

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

# Data Engineering
class DataEngineeringRequest(BaseModel):
    dataset_id: str
    operations: List[Dict[str, Any]]
    target_column: Optional[str] = None

class DataEngineeringResponse(BaseModel):
    newDatasetId: str
    rows: int
    columns: int
    operations_applied: List[str]
    feature_importance: Dict[str, float]
    original_shape: str
    new_shape: str

# Correlation
class CorrelationAnalysisRequest(BaseModel):
    dataset_id: str
    columns: Optional[List[str]] = None
    analysis_type: str = "comprehensive"

class CorrelationAnalysisResponse(BaseModel):
    analysis_type: str
    dataset_info: Dict[str, Any]
    correlation_matrices: Dict[str, Any]
    heatmap_data: Dict[str, Any]
    correlations: Dict[str, Any]
    trends: Dict[str, Any]
    statistics: Dict[str, Any]
    insights: List[str]
    visualization_data: Dict[str, Any]

class CorrelationReportRequest(BaseModel):
    dataset_id: str
    columns: Optional[List[str]] = None

class CorrelationReportResponse(BaseModel):
    html_report: str
    report_path: str

# Visualization
class VisualizationRequest(BaseModel):
    dataset_id: str
    chart_type: str
    columns: List[str]
    options: Optional[Dict[str, Any]] = None

class VisualizationResponse(BaseModel):
    chart_type: str
    columns_used: List[str]
    plotly_json: Dict[str, Any]
    png_preview: str
    png_data: str = ""  # Base64 encoded PNG data
    metadata: Dict[str, Any]

class ChartGalleryRequest(BaseModel):
    dataset_id: str
    columns: List[str]

class ChartGalleryResponse(BaseModel):
    gallery: Dict[str, Any]
    available_charts: List[str]
    metadata: Dict[str, Any]

class ChartRecommendationsRequest(BaseModel):
    dataset_id: str
    columns: List[str]

class ChartRecommendationsResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

# Modeling
class ModelingRequest(BaseModel):
    dataset_id: str
    features: List[str]
    target: str
    model_type: str = "classification"  # or "regression"
    algorithm: str = "random_forest"
    test_size: float = 0.2
    random_state: int = 42
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelingResponse(BaseModel):
    model_info: Dict[str, Any]
    metrics: Dict[str, Any]
    feature_importance: Dict[str, float]
    cross_validation: Dict[str, Any]
    visualizations: Dict[str, str]
    model_metadata: Dict[str, Any]

class HyperparameterTuningRequest(BaseModel):
    dataset_id: str
    features: List[str]
    target: str
    model_type: str
    algorithm: str
    param_grid: Dict[str, List[Any]]

class HyperparameterTuningResponse(BaseModel):
    best_params: Dict[str, Any]
    best_score: float
    cv_results: Dict[str, Any]

class ModelComparisonRequest(BaseModel):
    dataset_id: str
    features: List[str]
    target: str
    model_type: str
    algorithms: List[str]

class ModelComparisonResponse(BaseModel):
    results: Dict[str, Any]
    comparison_summary: Dict[str, Any]
    best_algorithm: str

class ModelRecommendationsRequest(BaseModel):
    dataset_id: str
    features: List[str]
    target: str

class ModelRecommendationsResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

class ToolInfo(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]

# -----------------------------
# Helpers
# -----------------------------

def _hash_for_id(project_id: str, csv_path: str) -> str:
    """Deterministic dataset_id for (project_id, csv_path)."""
    h = hashlib.sha1(f"{project_id}:{csv_path}".encode()).hexdigest()[:10]
    pid = "".join([c if c.isalnum() or c in ("_", "-") else "_" for c in project_id])
    return f"ds_{pid}_{h}"

def create_test_summary_stats(column: str) -> SummaryStatsResponse:
    """Create test summary statistics for demonstration purposes."""
    import numpy as np
    import pandas as pd
    np.random.seed(42)
    test_data = {
        'age': [25, 30, 35, 28, 32, 27, 29, 31, 33, 26, 34, 28, 30, 32, 29],
        'salary': [50000, 60000, 70000, 55000, 65000, 52000, 58000, 62000, 68000, 51000, 69000, 56000, 61000, 64000, 57000],
        'score': [85, 92, 78, 88, 95, 82, 90, 87, 93, 80, 91, 86, 89, 94, 83]
    }
    df = pd.DataFrame(test_data)
    if column in df.columns and pd.api.types.is_numeric_dtype(df[column]):
        series = df[column]
        mean_val = float(series.mean())
        median_val = float(series.median())
        std_val = float(series.std())
        null_pct = 0.0
        histogram = []
        if len(series) > 0:
            min_val, max_val = series.min(), series.max()
            bin_width = (max_val - min_val) / 5 if max_val != min_val else 1.0
            for i in range(5):
                bin_start = min_val + i * bin_width
                bin_end = min_val + (i + 1) * bin_width
                count = int(((series >= bin_start) & (series < bin_end)).sum())
                histogram.append({
                    "bin_start": float(bin_start),
                    "bin_end": float(bin_end),
                    "count": count,
                    "bin_center": float((bin_start + bin_end) / 2.0)
                })
    else:
        mean_val = median_val = std_val = 0.0
        null_pct = 0.0
        histogram = []
    return SummaryStatsResponse(
        mean=mean_val, median=median_val, std=std_val, nullPct=null_pct, histogram=histogram
    )

# -----------------------------
# Health + Tools Registry
# -----------------------------

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Python MCP Tool Server is running"}

@app.get("/mcp/tools", response_model=List[ToolInfo])
async def get_tools():
    """List available tools and their parameters."""
    return [
        ToolInfo(
            name="datasets.register",
            description="Register a CSV by copying it into sandbox/uploads and returning a dataset_id",
            parameters={"project_id": "string", "csv_path": "string"}
        ),
        ToolInfo(
            name="datasets.info",
            description="Get dataset info (rows, columns, dtypes)",
            parameters={"dataset_id": "string"}
        ),
        ToolInfo(
            name="clean.drop_nulls",
            description="Remove rows with null values from dataset",
            parameters={"dataset_id": "string", "columns": "List[string] (optional)"}
        ),
        ToolInfo(
            name="runtime.execute_python",
            description="Execute arbitrary Python code on a dataset df to apply custom operations",
            parameters={"datasetId": "string", "code": "string"}
        ),
        ToolInfo(
            name="stats.summary",
            description="Compute summary statistics for a column",
            parameters={"dataset_id": "string", "column": "string"}
        ),
        ToolInfo(
            name="data_engineering.engineer",
            description="Perform data engineering operations (transforms, scaling, encoding, etc.)",
            parameters={
                "dataset_id": "string",
                "operations": "List[Dict] - Data engineering operations to apply",
                "target_column": "string (optional)"
            }
        ),
        ToolInfo(
            name="correlation.analyze",
            description="Perform comprehensive correlation analysis and pattern detection",
            parameters={
                "dataset_id": "string",
                "columns": "List[string] (optional)",
                "analysis_type": "string (comprehensive|quick|detailed)"
            }
        ),
        ToolInfo(
            name="correlation.report",
            description="Generate comprehensive correlation analysis HTML report",
            parameters={"dataset_id": "string", "columns": "List[string] (optional)"}
        ),
        ToolInfo(
            name="visualization.generate",
            description="Generate Plotly chart with PNG preview",
            parameters={
                "dataset_id": "string",
                "chart_type": "string (histogram|scatter|line|bar|heatmap|box|violin|correlation|pairplot|distribution)",
                "columns": "List[string]",
                "options": "Dict (optional)"
            }
        ),
        ToolInfo(
            name="visualization.gallery",
            description="Create a gallery of different chart types for the dataset",
            parameters={"dataset_id": "string", "columns": "List[string]"}
        ),
        ToolInfo(
            name="visualization.recommendations",
            description="Get chart type recommendations based on data characteristics",
            parameters={"dataset_id": "string", "columns": "List[string]"}
        ),
        ToolInfo(
            name="modeling.train",
            description="Train an ML model (classification or regression)",
            parameters={
                "dataset_id": "string",
                "features": "List[string]",
                "target": "string",
                "model_type": "string (classification|regression)",
                "algorithm": "string",
                "test_size": "float (optional)",
                "random_state": "int (optional)",
                "hyperparameters": "Dict (optional)"
            }
        ),
        ToolInfo(
            name="modeling.hyperparameter_tuning",
            description="Perform hyperparameter tuning",
            parameters={
                "dataset_id": "string",
                "features": "List[string]",
                "target": "string",
                "model_type": "string",
                "algorithm": "string",
                "param_grid": "Dict"
            }
        ),
        ToolInfo(
            name="modeling.compare",
            description="Compare multiple algorithms",
            parameters={
                "dataset_id": "string",
                "features": "List[string]",
                "target": "string",
                "model_type": "string",
                "algorithms": "List[string]"
            }
        ),
        ToolInfo(
            name="modeling.recommendations",
            description="Get model recommendations based on dataset characteristics",
            parameters={"dataset_id": "string", "features": "List[string]", "target": "string"}
        ),
    ]

# -----------------------------
# Datasets: Register + Info
# -----------------------------

@app.post("/mcp/datasets/register", response_model=RegisterDatasetResponse)
async def register_dataset(req: RegisterDatasetRequest):
    """
    Register a CSV in the sandbox by copying it into uploads/ with a deterministic dataset_id.
    Returns dataset_id and basic shape.
    """
    try:
        abs_src = os.path.abspath(req.csv_path)
        if not os.path.exists(abs_src):
            raise HTTPException(status_code=404, detail=f"CSV not found at {abs_src}")
        dataset_id = _hash_for_id(req.project_id, abs_src)
        dst_path = os.path.join(UPLOADS_DIR, f"{dataset_id}.csv")
        if not os.path.exists(dst_path):
            shutil.copyfile(abs_src, dst_path)
            logger.info(f"📥 Copied CSV into sandbox: {abs_src} -> {dst_path}")
        # Read a sample to report shape quickly
        try:
            df = pd.read_csv(dst_path, nrows=1000)
            rows = int(df.shape[0])
            cols = int(df.shape[1])
        except Exception as e:
            logger.warning(f"Could not read CSV for shape: {e}")
            rows, cols = 0, 0
        return RegisterDatasetResponse(dataset_id=dataset_id, rows=rows, columns=cols, path=dst_path)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in register_dataset")
        raise HTTPException(status_code=500, detail=f"Error registering dataset: {str(e)}")

@app.post("/mcp/datasets/info", response_model=DatasetInfoResponse)
async def datasets_info(req: DatasetInfoRequest):
    """
    Return dataset info (rows, columns, dtypes) using tools.cleaning.get_dataset_info.
    Assumes dataset files live in uploads/ as CSV or Parquet per your tools implementation.
    """
    try:
        info = get_dataset_info(req.dataset_id)
        return DatasetInfoResponse(**info)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error in datasets_info")
        raise HTTPException(status_code=500, detail=f"Error getting dataset info: {str(e)}")

# -----------------------------
# Cleaning
# -----------------------------

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

# -----------------------------
# Runtime execution
# -----------------------------

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

# -----------------------------
# Stats
# -----------------------------

@app.post("/mcp/stats/summary", response_model=SummaryStatsResponse)
async def summary_stats_endpoint(request: SummaryStatsRequest):
    """Compute summary statistics for a column."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")
        
        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path

        if dataset_path is None:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Returning test stats...")
            return create_test_summary_stats(request.column)
        
        result = compute_summary_stats(dataset_path, request.column)
        return SummaryStatsResponse(
            mean=result["mean"],
            median=result["median"],
            std=result["std"],
            nullPct=result["nullPct"],
            histogram=result["histogram"]
        )
    except Exception as e:
        logger.error(f"Error in summary_stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error computing summary statistics: {str(e)}")

# -----------------------------
# Data Engineering
# -----------------------------

@app.post("/mcp/data_engineering/engineer", response_model=DataEngineeringResponse)
async def data_engineering_endpoint(request: DataEngineeringRequest):
    """Perform data engineering operations on a dataset."""
    try:
        result = engineer_data(
            request.dataset_id,
            request.operations,
            request.target_column
        )
        return DataEngineeringResponse(
            newDatasetId=result["newDatasetId"],
            rows=result["rows"],
            columns=result["columns"],
            operations_applied=result.get("operations_applied", []),
            feature_importance=result.get("feature_importance", {}),
            original_shape=result.get("original_shape", ""),
            new_shape=result.get("new_shape", "")
        )
    except Exception as e:
        logger.error(f"Error in data engineering: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in data engineering: {str(e)}")

# -----------------------------
# Correlation Analysis
# -----------------------------

@app.post("/mcp/correlation/analyze", response_model=CorrelationAnalysisResponse)
async def correlation_analysis_endpoint(request: CorrelationAnalysisRequest):
    """Perform comprehensive correlation analysis and pattern detection."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_correlation_dataset(request.dataset_id)

        result = analyze_correlations(dataset_path, request.columns, request.analysis_type)
        return CorrelationAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Error in correlation analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in correlation analysis: {str(e)}")

@app.post("/mcp/correlation/report", response_model=CorrelationReportResponse)
async def correlation_report_endpoint(request: CorrelationReportRequest):
    """Generate comprehensive correlation analysis report."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_correlation_dataset(request.dataset_id)

        html_report = create_correlation_report(dataset_path, request.columns)
        report_path = os.path.join(UPLOADS_DIR, f"correlation_report_{request.dataset_id}.html")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(html_report)
        
        return CorrelationReportResponse(html_report=html_report, report_path=report_path)
    except Exception as e:
        logger.error(f"Error generating correlation report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating correlation report: {str(e)}")

# -----------------------------
# Visualization
# -----------------------------

@app.post("/mcp/visualization/generate", response_model=VisualizationResponse)
async def visualization_generate_endpoint(request: VisualizationRequest):
    """Generate Plotly chart with optional PNG preview."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_visualization_dataset(request.dataset_id)

        result = generate_plotly_chart(dataset_path, request.chart_type, request.columns, request.options)
        return VisualizationResponse(**result)
    except Exception as e:
        logger.error(f"Error generating visualization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating visualization: {str(e)}")

@app.post("/mcp/visualization/gallery", response_model=ChartGalleryResponse)
async def visualization_gallery_endpoint(request: ChartGalleryRequest):
    """Create a gallery of different chart types for the dataset."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_visualization_dataset(request.dataset_id)

        result = create_chart_gallery(dataset_path, request.columns)
        return ChartGalleryResponse(**result)
    except Exception as e:
        logger.error(f"Error creating chart gallery: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating chart gallery: {str(e)}")

@app.post("/mcp/visualization/recommendations", response_model=ChartRecommendationsResponse)
async def visualization_recommendations_endpoint(request: ChartRecommendationsRequest):
    """Get chart type recommendations based on data characteristics."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_visualization_dataset(request.dataset_id)

        recommendations = get_chart_recommendations(dataset_path, request.columns)
        return ChartRecommendationsResponse(recommendations=recommendations)
    except Exception as e:
        logger.error(f"Error getting chart recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting chart recommendations: {str(e)}")

# -----------------------------
# Modeling
# -----------------------------

@app.post("/mcp/modeling/train", response_model=ModelingResponse)
async def modeling_train_endpoint(request: ModelingRequest):
    """Train a machine learning model."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_modeling_dataset(request.dataset_id)

        result = train_ml_model(
            dataset_path,
            request.features,
            request.target,
            request.model_type,
            request.algorithm,
            request.test_size,
            request.random_state,
            request.hyperparameters
        )
        return ModelingResponse(**result)
    except Exception as e:
        logger.error(f"Error training model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@app.post("/mcp/modeling/hyperparameter-tuning", response_model=HyperparameterTuningResponse)
async def hyperparameter_tuning_endpoint(request: HyperparameterTuningRequest):
    """Perform hyperparameter tuning for a model."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_modeling_dataset(request.dataset_id)

        result = hyperparameter_tuning(
            dataset_path,
            request.features,
            request.target,
            request.model_type,
            request.algorithm,
            request.param_grid
        )
        return HyperparameterTuningResponse(**result)
    except Exception as e:
        logger.error(f"Error in hyperparameter tuning: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in hyperparameter tuning: {str(e)}")

@app.post("/mcp/modeling/compare", response_model=ModelComparisonResponse)
async def model_comparison_endpoint(request: ModelComparisonRequest):
    """Compare multiple machine learning algorithms."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_modeling_dataset(request.dataset_id)

        result = model_comparison(
            dataset_path,
            request.features,
            request.target,
            request.model_type,
            request.algorithms
        )
        return ModelComparisonResponse(**result)
    except Exception as e:
        logger.error(f"Error in model comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in model comparison: {str(e)}")

@app.post("/mcp/modeling/recommendations", response_model=ModelRecommendationsResponse)
async def model_recommendations_endpoint(request: ModelRecommendationsRequest):
    """Get model recommendations based on dataset characteristics."""
    try:
        parquet_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.parquet")
        csv_path = os.path.join(UPLOADS_DIR, f"{request.dataset_id}.csv")

        dataset_path = None
        if os.path.exists(parquet_path):
            dataset_path = parquet_path
        elif os.path.exists(csv_path):
            dataset_path = csv_path
        else:
            logger.warning(f"Dataset file not found: {request.dataset_id}. Creating test dataset...")
            dataset_path = create_test_modeling_dataset(request.dataset_id)

        recommendations = get_model_recommendations(
            dataset_path,
            request.features,
            request.target
        )
        return ModelRecommendationsResponse(recommendations=recommendations)
    except Exception as e:
        logger.error(f"Error getting model recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting model recommendations: {str(e)}")

# -----------------------------
# Entrypoint
# -----------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)