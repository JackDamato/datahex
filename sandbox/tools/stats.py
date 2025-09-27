"""
Statistical Analysis Tools

This module provides statistical analysis functions for the MCP tool server.
Implements summary statistics computation with histogram generation.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
import os
from pathlib import Path


def compute_summary_stats(dataset_path: str, column: str) -> Dict[str, Any]:
    """
    Compute comprehensive summary statistics for a specific column.
    
    Args:
        dataset_path (str): Path to the dataset file
        column (str): Name of the column to analyze
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - mean (float): Mean value
            - median (float): Median value
            - std (float): Standard deviation
            - nullPct (float): Percentage of null values
            - histogram (List[Dict]): Histogram data with 10 buckets
    
    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        KeyError: If the specified column doesn't exist
        ValueError: If the column is not numeric
        Exception: For other processing errors
    """
    try:
        # Validate input file exists
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
        
        # Load dataset
        df = load_dataset(dataset_path)
        
        # Validate column exists
        if column not in df.columns:
            available_columns = df.columns.tolist()
            raise KeyError(f"Column '{column}' not found. Available columns: {available_columns}")
        
        # Get the target column
        series = df[column]
        
        # Check if column is numeric
        if not pd.api.types.is_numeric_dtype(series):
            raise ValueError(f"Column '{column}' is not numeric. Type: {series.dtype}")
        
        # Remove null values for calculations
        numeric_series = series.dropna()
        
        # Calculate basic statistics
        mean_val = float(numeric_series.mean()) if len(numeric_series) > 0 else 0.0
        median_val = float(numeric_series.median()) if len(numeric_series) > 0 else 0.0
        std_val = float(numeric_series.std()) if len(numeric_series) > 0 else 0.0
        
        # Calculate null percentage
        total_values = len(series)
        null_count = series.isnull().sum()
        null_pct = (null_count / total_values) * 100 if total_values > 0 else 0.0
        
        # Generate histogram data (10 buckets)
        histogram = generate_histogram(numeric_series, bins=10)
        
        return {
            "mean": mean_val,
            "median": median_val,
            "std": std_val,
            "nullPct": null_pct,
            "histogram": histogram
        }
        
    except FileNotFoundError:
        raise
    except KeyError:
        raise
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Error computing summary statistics: {str(e)}")


def generate_histogram(series: pd.Series, bins: int = 10) -> List[Dict[str, Any]]:
    """
    Generate histogram data for a numeric series.
    
    Args:
        series (pd.Series): Numeric series to create histogram for
        bins (int): Number of histogram bins
    
    Returns:
        List[Dict[str, Any]]: List of histogram buckets with counts
    """
    try:
        if len(series) == 0:
            return []
        
        # Calculate histogram
        counts, bin_edges = np.histogram(series, bins=bins)
        
        # Create histogram data
        histogram_data = []
        for i in range(len(counts)):
            histogram_data.append({
                "bin_start": float(bin_edges[i]),
                "bin_end": float(bin_edges[i + 1]),
                "count": int(counts[i]),
                "bin_center": float((bin_edges[i] + bin_edges[i + 1]) / 2)
            })
        
        return histogram_data
        
    except Exception as e:
        # Return empty histogram if there's an error
        return []


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


def compute_correlation_matrix(dataset_path: str, columns: List[str] = None) -> Dict[str, Any]:
    """
    Compute correlation matrix for numeric columns.
    
    Args:
        dataset_path (str): Path to the dataset file
        columns (List[str], optional): List of columns to include. If None, uses all numeric columns.
    
    Returns:
        Dict[str, Any]: Correlation matrix and metadata
    """
    try:
        df = load_dataset(dataset_path)
        
        # Select numeric columns
        if columns is None:
            numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            numeric_columns = [col for col in columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        
        if len(numeric_columns) < 2:
            raise ValueError("Need at least 2 numeric columns for correlation matrix")
        
        # Compute correlation matrix
        corr_matrix = df[numeric_columns].corr()
        
        # Convert to dictionary format
        correlation_data = {
            "columns": numeric_columns,
            "matrix": corr_matrix.to_dict(),
            "summary": {
                "max_correlation": float(corr_matrix.max().max()),
                "min_correlation": float(corr_matrix.min().min()),
                "high_correlations": []
            }
        }
        
        # Find high correlations (|r| > 0.7)
        for i in range(len(numeric_columns)):
            for j in range(i + 1, len(numeric_columns)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.7:
                    correlation_data["summary"]["high_correlations"].append({
                        "column1": numeric_columns[i],
                        "column2": numeric_columns[j],
                        "correlation": float(corr_val)
                    })
        
        return correlation_data
        
    except ValueError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error computing correlation matrix: {str(e)}")


def detect_outliers(dataset_path: str, column: str, method: str = "iqr") -> Dict[str, Any]:
    """
    Detect outliers in a numeric column using IQR or Z-score method.
    
    Args:
        dataset_path (str): Path to the dataset file
        column (str): Name of the column to analyze
        method (str): Method to use ('iqr' or 'zscore')
    
    Returns:
        Dict[str, Any]: Outlier detection results
    """
    try:
        df = load_dataset(dataset_path)
        
        if column not in df.columns:
            raise KeyError(f"Column '{column}' not found")
        
        if not pd.api.types.is_numeric_dtype(df[column]):
            raise ValueError(f"Column '{column}' is not numeric")
        
        series = df[column].dropna()
        
        if method == "iqr":
            Q1 = series.quantile(0.25)
            Q3 = series.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = series[(series < lower_bound) | (series > upper_bound)]
            
        elif method == "zscore":
            z_scores = np.abs((series - series.mean()) / series.std())
            outliers = series[z_scores > 3]
            
        else:
            raise ValueError("Method must be 'iqr' or 'zscore'")
        
        return {
            "column": column,
            "method": method,
            "outlier_count": len(outliers),
            "outlier_percentage": (len(outliers) / len(series)) * 100,
            "outlier_values": outliers.tolist(),
            "bounds": {
                "lower": float(lower_bound) if method == "iqr" else None,
                "upper": float(upper_bound) if method == "iqr" else None
            }
        }
        
    except (KeyError, ValueError) as e:
        raise e
    except Exception as e:
        raise Exception(f"Error detecting outliers: {str(e)}")
