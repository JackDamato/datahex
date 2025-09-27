"""
Plot Generation Tools

This module provides plotting functions for the MCP tool server.
Generates Plotly JSON for various chart types including histograms, scatter plots, and heatmaps.
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
import json
from typing import List, Dict, Any
import os
from pathlib import Path


def convert_numpy_to_python(obj):
    """
    Recursively convert numpy arrays and types to Python native types for JSON serialization.
    
    Args:
        obj: Object that may contain numpy arrays
        
    Returns:
        Object with numpy arrays converted to Python lists
    """
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: convert_numpy_to_python(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_to_python(item) for item in obj]
    else:
        return obj


def generate_plot(dataset_path: str, plot_type: str, columns: List[str]) -> Dict[str, Any]:
    """
    Generate a Plotly visualization based on the specified type and columns.
    
    Args:
        dataset_path (str): Path to the dataset file
        plot_type (str): Type of plot ('histogram', 'scatter', 'heatmap')
        columns (List[str]): List of columns to use in the plot
    
    Returns:
        Dict[str, Any]: Plotly JSON configuration
    
    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        ValueError: If plot type is not supported or columns are invalid
        Exception: For other processing errors
    """
    try:
        # Validate input file exists
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
        
        # Load dataset
        df = load_dataset(dataset_path)
        
        # Validate columns exist
        missing_columns = [col for col in columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Columns not found in dataset: {missing_columns}")
        
        # Generate plot based on type
        if plot_type == "histogram":
            result = generate_histogram_plot(df, columns)
        elif plot_type == "scatter":
            result = generate_scatter_plot(df, columns)
        elif plot_type == "heatmap":
            result = generate_heatmap_plot(df, columns)
        else:
            raise ValueError(f"Unsupported plot type: {plot_type}. Supported types: histogram, scatter, heatmap")
        
        # Convert numpy arrays to Python native types for JSON serialization
        result = convert_numpy_to_python(result)
        
        return result
            
    except FileNotFoundError:
        raise
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Error generating plot: {str(e)}")


def generate_histogram_plot(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Generate a histogram plot for specified columns.
    
    Args:
        df (pd.DataFrame): Dataset
        columns (List[str]): Columns to plot
    
    Returns:
        Dict[str, Any]: Plotly JSON configuration
    """
    try:
        if len(columns) == 0:
            raise ValueError("At least one column must be specified for histogram")
        
        # Filter to numeric columns only
        numeric_columns = [col for col in columns if pd.api.types.is_numeric_dtype(df[col])]
        if not numeric_columns:
            raise ValueError("No numeric columns found for histogram")
        
        # Create subplots if multiple columns
        if len(numeric_columns) == 1:
            fig = go.Figure()
            fig.add_trace(go.Histogram(
                x=df[numeric_columns[0]].dropna(),
                name=numeric_columns[0],
                nbinsx=20
            ))
            fig.update_layout(
                title=f"Histogram of {numeric_columns[0]}",
                xaxis_title=numeric_columns[0],
                yaxis_title="Count"
            )
        else:
            from plotly.subplots import make_subplots
            rows = (len(numeric_columns) + 1) // 2
            cols = 2
            
            fig = make_subplots(
                rows=rows, 
                cols=cols,
                subplot_titles=numeric_columns
            )
            
            for i, col in enumerate(numeric_columns):
                row = (i // cols) + 1
                col_idx = (i % cols) + 1
                fig.add_trace(
                    go.Histogram(
                        x=df[col].dropna(),
                        name=col,
                        nbinsx=20
                    ),
                    row=row, col=col_idx
                )
            
            fig.update_layout(
                title="Histograms of Numeric Columns",
                showlegend=False
            )
        
        return fig.to_dict()
        
    except ValueError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error generating histogram plot: {str(e)}")


def generate_scatter_plot(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Generate a scatter plot for specified columns.
    
    Args:
        df (pd.DataFrame): Dataset
        columns (List[str]): Columns to plot (at least 2 required)
    
    Returns:
        Dict[str, Any]: Plotly JSON configuration
    """
    try:
        if len(columns) < 2:
            raise ValueError("At least 2 columns required for scatter plot")
        
        # Filter to numeric columns only
        numeric_columns = [col for col in columns if pd.api.types.is_numeric_dtype(df[col])]
        if len(numeric_columns) < 2:
            raise ValueError("At least 2 numeric columns required for scatter plot")
        
        # Use first two numeric columns for x and y
        x_col, y_col = numeric_columns[0], numeric_columns[1]
        
        # Create scatter plot
        fig = go.Figure()
        
        # Add scatter trace
        fig.add_trace(go.Scatter(
            x=df[x_col].dropna(),
            y=df[y_col].dropna(),
            mode='markers',
            name=f"{x_col} vs {y_col}",
            marker=dict(
                size=8,
                opacity=0.6,
                color=df[y_col].dropna(),
                colorscale='Viridis',
                showscale=True,
                colorbar=dict(title=y_col)
            )
        ))
        
        # Add trend line if enough points
        if len(df.dropna(subset=[x_col, y_col])) > 2:
            z = np.polyfit(df[x_col].dropna(), df[y_col].dropna(), 1)
            p = np.poly1d(z)
            x_trend = np.linspace(df[x_col].min(), df[x_col].max(), 100)
            y_trend = p(x_trend)
            
            fig.add_trace(go.Scatter(
                x=x_trend,
                y=y_trend,
                mode='lines',
                name='Trend Line',
                line=dict(color='red', dash='dash')
            ))
        
        fig.update_layout(
            title=f"Scatter Plot: {x_col} vs {y_col}",
            xaxis_title=x_col,
            yaxis_title=y_col,
            hovermode='closest'
        )
        
        return fig.to_dict()
        
    except ValueError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error generating scatter plot: {str(e)}")


def generate_heatmap_plot(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Generate a correlation heatmap for specified columns.
    
    Args:
        df (pd.DataFrame): Dataset
        columns (List[str]): Columns to include in heatmap
    
    Returns:
        Dict[str, Any]: Plotly JSON configuration
    """
    try:
        if len(columns) < 2:
            raise ValueError("At least 2 columns required for heatmap")
        
        # Filter to numeric columns only
        numeric_columns = [col for col in columns if pd.api.types.is_numeric_dtype(df[col])]
        if len(numeric_columns) < 2:
            raise ValueError("At least 2 numeric columns required for heatmap")
        
        # Compute correlation matrix
        corr_matrix = df[numeric_columns].corr()
        
        # Create heatmap
        fig = go.Figure(data=go.Heatmap(
            z=corr_matrix.values,
            x=corr_matrix.columns,
            y=corr_matrix.columns,
            colorscale='RdBu',
            zmid=0,
            text=corr_matrix.round(3).values,
            texttemplate="%{text}",
            textfont={"size": 10},
            hoverongaps=False
        ))
        
        fig.update_layout(
            title="Correlation Heatmap",
            xaxis_title="Variables",
            yaxis_title="Variables",
            width=600,
            height=600
        )
        
        return fig.to_dict()
        
    except ValueError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error generating heatmap plot: {str(e)}")


def load_dataset(dataset_path: str) -> pd.DataFrame:
    """
    Load a dataset from various file formats.
    
    Args:
        dataset_path (str): Path to the dataset file
    
    Returns:
        pd.DataFrame: Loaded dataset
    
    Raises:
        ValueError: If file format is not supported
    """
    file_extension = Path(dataset_path).suffix.lower()
    
    if file_extension == '.csv':
        return pd.read_csv(dataset_path)
    elif file_extension == '.parquet':
        return pd.read_parquet(dataset_path)
    elif file_extension in ['.xlsx', '.xls']:
        return pd.read_excel(dataset_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")


def generate_box_plot(dataset_path: str, columns: List[str]) -> Dict[str, Any]:
    """
    Generate a box plot for specified columns.
    
    Args:
        dataset_path (str): Path to the dataset file
        columns (List[str]): Columns to plot
    
    Returns:
        Dict[str, Any]: Plotly JSON configuration
    """
    try:
        df = load_dataset(dataset_path)
        
        # Filter to numeric columns only
        numeric_columns = [col for col in columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        if not numeric_columns:
            raise ValueError("No numeric columns found for box plot")
        
        fig = go.Figure()
        
        for col in numeric_columns:
            fig.add_trace(go.Box(
                y=df[col].dropna(),
                name=col,
                boxpoints='outliers'
            ))
        
        fig.update_layout(
            title="Box Plot of Numeric Columns",
            yaxis_title="Values",
            xaxis_title="Columns"
        )
        
        return fig.to_dict()
        
    except Exception as e:
        raise Exception(f"Error generating box plot: {str(e)}")


def generate_time_series_plot(dataset_path: str, time_column: str, value_columns: List[str]) -> Dict[str, Any]:
    """
    Generate a time series plot for specified columns.
    
    Args:
        dataset_path (str): Path to the dataset file
        time_column (str): Name of the time column
        value_columns (List[str]): Columns to plot over time
    
    Returns:
        Dict[str, Any]: Plotly JSON configuration
    """
    try:
        df = load_dataset(dataset_path)
        
        if time_column not in df.columns:
            raise ValueError(f"Time column '{time_column}' not found")
        
        # Convert time column to datetime
        df[time_column] = pd.to_datetime(df[time_column])
        
        # Filter to numeric value columns
        numeric_columns = [col for col in value_columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        if not numeric_columns:
            raise ValueError("No numeric columns found for time series plot")
        
        fig = go.Figure()
        
        for col in numeric_columns:
            fig.add_trace(go.Scatter(
                x=df[time_column],
                y=df[col],
                mode='lines+markers',
                name=col
            ))
        
        fig.update_layout(
            title="Time Series Plot",
            xaxis_title=time_column,
            yaxis_title="Values",
            hovermode='x unified'
        )
        
        return fig.to_dict()
        
    except Exception as e:
        raise Exception(f"Error generating time series plot: {str(e)}")
