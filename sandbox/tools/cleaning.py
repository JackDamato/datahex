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


def drop_nulls(dataset_id: str, columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Remove rows with null values from a dataset.
    
    Args:
        dataset_id (str): ID of the dataset in uploads/{dataset_id}.parquet
        columns (Optional[List[str]]): List of columns to check for nulls. 
                                     If None, checks all columns.
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - newDatasetId (str): ID of the new cleaned dataset
            - rows (int): Number of rows in cleaned dataset
    
    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        ValueError: If the dataset format is not supported
        Exception: For other processing errors
    """
    try:
        # Construct file path
        dataset_path = f"uploads/{dataset_id}.parquet"
        
        # Validate input file exists
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
        
        # Load parquet data
        df = pd.read_parquet(dataset_path)
        
        # Store original dimensions
        original_rows = len(df)
        
        if df.empty:
            summary = "Dataset is empty, no cleaning performed."
            new_df = df
        else:
            # Perform cleaning
            if columns:
                # Validate specified columns
                invalid_columns = [col for col in columns if col not in df.columns]
                if invalid_columns:
                    raise ValueError(f"Columns not found in dataset: {invalid_columns}")
                new_df = df.dropna(subset=columns)
            else:
                new_df = df.dropna()

            rows_removed = original_rows - len(new_df)
            summary = f"Cleaned dataset: {rows_removed} rows removed, kept {len(new_df)} rows. Checked columns: {', '.join(columns) if columns else 'all'}"

        # Generate new dataset ID
        new_dataset_id = str(uuid.uuid4())
        new_dataset_path = f"uploads/{new_dataset_id}.parquet"
        
        # Ensure uploads directory exists
        os.makedirs("uploads", exist_ok=True)
        
        # Save cleaned data as parquet
        new_df.to_parquet(new_dataset_path, index=False)

        return {
            "newDatasetId": new_dataset_id,
            "rows": len(new_df),
            "summary": summary
        }

    except FileNotFoundError:
        raise
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Error cleaning data: {str(e)}")


def get_dataset_info(dataset_id: str) -> Dict[str, Any]:
    """
    Get basic information about a dataset.

    Args:
        dataset_id (str): ID of the dataset in uploads/{dataset_id}.parquet

    Returns:
        Dict[str, Any]: Dictionary containing dataset information
    """
    dataset_path = f"uploads/{dataset_id}.parquet"
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")

    try:
        df = pd.read_parquet(dataset_path)

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