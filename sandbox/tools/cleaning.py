"""
Data Cleaning Tools

This module provides data cleaning functions for the MCP tool server.
Currently implements drop_nulls functionality using pandas and pyarrow.
"""

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import os
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any


def drop_nulls(dataset_path: str, columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Remove rows with null values from a dataset.
    
    Args:
        dataset_path (str): Path to the input dataset file
        columns (Optional[List[str]]): List of columns to check for nulls. 
                                     If None, checks all columns.
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - newDatasetPath (str): Path to the cleaned dataset
            - rows (int): Number of rows in cleaned dataset
            - columns (int): Number of columns in cleaned dataset
            - summary (str): Summary of the cleaning operation
    
    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        ValueError: If the dataset format is not supported
        Exception: For other processing errors
    """
    try:
        # Validate input file exists
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
        
        # Determine file format and load data
        file_extension = Path(dataset_path).suffix.lower()
        
        try:
            if file_extension == '.csv':
                df = pd.read_csv(dataset_path)
            elif file_extension == '.parquet':
                df = pd.read_parquet(dataset_path)
            elif file_extension in ['.xlsx', '.xls']:
                df = pd.read_excel(dataset_path)
            else:
                raise ValueError(f"Unsupported file format: {file_extension}")
        except pd.errors.EmptyDataError:
            # Handle empty CSV files
            df = pd.DataFrame()
        
        # Store original dimensions
        original_rows = len(df)
        original_columns = len(df.columns)
        
        # Determine which columns to check for nulls
        if columns is None:
            columns_to_check = df.columns.tolist()
        else:
            # Validate that specified columns exist
            missing_columns = [col for col in columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Columns not found in dataset: {missing_columns}")
            columns_to_check = columns
        
        # Count nulls before cleaning
        null_counts = df[columns_to_check].isnull().sum()
        total_nulls = null_counts.sum()
        
        # Drop rows with null values in specified columns
        df_cleaned = df.dropna(subset=columns_to_check)
        
        # Store cleaned dimensions
        cleaned_rows = len(df_cleaned)
        cleaned_columns = len(df_cleaned.columns)
        rows_removed = original_rows - cleaned_rows
        
        # Generate output filename
        output_dir = Path(dataset_path).parent / "cleaned"
        output_dir.mkdir(exist_ok=True)
        
        file_stem = Path(dataset_path).stem
        file_extension = Path(dataset_path).suffix
        output_filename = f"{file_stem}_cleaned_{uuid.uuid4().hex[:8]}{file_extension}"
        output_path = output_dir / output_filename
        
        # Save cleaned dataset
        if file_extension == '.csv':
            df_cleaned.to_csv(output_path, index=False)
        elif file_extension == '.parquet':
            df_cleaned.to_parquet(output_path, index=False)
        elif file_extension in ['.xlsx', '.xls']:
            df_cleaned.to_excel(output_path, index=False)
        
        # Generate summary
        summary = f"Cleaned dataset: {rows_removed} rows removed ({total_nulls} null values), "
        summary += f"kept {cleaned_rows} rows. "
        summary += f"Checked columns: {', '.join(columns_to_check)}"
        
        return {
            "newDatasetPath": str(output_path),
            "rows": cleaned_rows,
            "columns": cleaned_columns,
            "summary": summary
        }
        
    except FileNotFoundError:
        raise
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Error during data cleaning: {str(e)}")


def validate_dataset_format(file_path: str) -> bool:
    """
    Validate that a file is in a supported format.
    
    Args:
        file_path (str): Path to the file to validate
    
    Returns:
        bool: True if format is supported, False otherwise
    """
    supported_extensions = ['.csv', '.parquet', '.xlsx', '.xls']
    file_extension = Path(file_path).suffix.lower()
    return file_extension in supported_extensions


def get_dataset_info(dataset_path: str) -> Dict[str, Any]:
    """
    Get basic information about a dataset.
    
    Args:
        dataset_path (str): Path to the dataset file
    
    Returns:
        Dict[str, Any]: Dictionary containing dataset information
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
    
    try:
        file_extension = Path(dataset_path).suffix.lower()
        
        if file_extension == '.csv':
            df = pd.read_csv(dataset_path)
        elif file_extension == '.parquet':
            df = pd.read_parquet(dataset_path)
        elif file_extension in ['.xlsx', '.xls']:
            df = pd.read_excel(dataset_path)
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
        
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "dtypes": df.dtypes.to_dict(),
            "memory_usage": df.memory_usage(deep=True).sum(),
            "null_counts": df.isnull().sum().to_dict()
        }
        
    except Exception as e:
        raise Exception(f"Error getting dataset info: {str(e)}")
