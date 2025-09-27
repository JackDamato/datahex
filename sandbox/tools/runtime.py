"""
Runtime Tools

This module provides runtime execution functions for the MCP tool server.
Implements execute_python functionality for safe code execution with dataset access.
"""

import subprocess
import tempfile
import os
import sys
import uuid
import re
from typing import Dict, Any, Optional
import logging
import pandas as pd
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define allowed imports for safety
ALLOWED_IMPORTS = {
    'pandas', 'pd', 'numpy', 'np', 'sklearn', 'plotly', 'math', 'json', 'datetime'
}

# Define forbidden imports for security
FORBIDDEN_IMPORTS = {
    'os', 'subprocess', 'requests', 'urllib', 'socket', 'sys', 'importlib',
    'exec', 'eval', 'compile', 'open', 'file', '__import__'
}

def validate_code_safety(code: str) -> None:
    """
    Validate that the code doesn't contain dangerous imports or operations.
    
    Args:
        code (str): Python code to validate
        
    Raises:
        ValueError: If code contains forbidden imports or operations
    """
    # Check for forbidden imports
    import_pattern = r'(?:^|\n)\s*(?:from\s+(\w+)\s+import|import\s+(\w+))'
    matches = re.findall(import_pattern, code, re.MULTILINE)
    
    for match in matches:
        module_name = match[0] or match[1]  # from X import Y or import X
        if module_name in FORBIDDEN_IMPORTS:
            raise ValueError(f"Forbidden import detected: {module_name}")
    
    # Check for dangerous operations
    dangerous_patterns = [
        r'__import__\s*\(',
        r'exec\s*\(',
        r'eval\s*\(',
        r'compile\s*\(',
        r'open\s*\(',
        r'file\s*\(',
        r'input\s*\(',
        r'raw_input\s*\(',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, code):
            raise ValueError(f"Dangerous operation detected: {pattern}")

def load_dataset(dataset_id: str) -> pd.DataFrame:
    """
    Load a dataset from the uploads directory.
    
    Args:
        dataset_id (str): ID of the dataset to load
        
    Returns:
        pd.DataFrame: Loaded dataset
        
    Raises:
        FileNotFoundError: If dataset file doesn't exist
    """
    uploads_dir = Path("uploads")
    file_path = uploads_dir / f"{dataset_id}.parquet"
    
    if not file_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    
    return pd.read_parquet(file_path)

def save_dataset(df: pd.DataFrame) -> str:
    """
    Save a DataFrame to the uploads directory with a new UUID as ID.
    
    Args:
        df (pd.DataFrame): DataFrame to save
        
    Returns:
        str: New dataset ID
    """
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    
    new_dataset_id = str(uuid.uuid4())
    file_path = uploads_dir / f"{new_dataset_id}.parquet"
    df.to_parquet(file_path, index=False)
    
    return new_dataset_id

def execute_python(code: str) -> Dict[str, Any]:
    """
    Execute Python code safely in a subprocess with timeout.
    
    Args:
        code (str): Python code to execute
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - stdout (str): Standard output from execution
            - stderr (str): Standard error from execution
            - returncode (int): Return code from execution
    
    Raises:
        Exception: For execution errors or timeout
    """
    try:
        # Log warning about unsafe execution
        logger.warning("⚠️ execute_python is unsafe, do not use in production")
        
        # Create temporary file for the code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name
        
        try:
            # Execute the code with timeout
            result = subprocess.run(
                [sys.executable, temp_file_path],
                capture_output=True,
                text=True,
                timeout=5,  # 5 second timeout
                cwd=os.getcwd()
            )
            
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass  # File might already be deleted
                
    except subprocess.TimeoutExpired:
        raise Exception("Code execution timed out after 5 seconds")
    except Exception as e:
        raise Exception(f"Error executing Python code: {str(e)}")

def execute_python_on_dataset(dataset_id: str, code: str) -> Dict[str, Any]:
    """
    Execute Python code on a dataset with access to a pandas DataFrame variable 'df'.
    
    Args:
        dataset_id (str): ID of the dataset to load
        code (str): Python code to execute (will have access to 'df' variable)
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - status (str): "success" or "error"
            - newDatasetId (str): UUID of new dataset or null
            - stdout (str): Standard output from execution
            - stderr (str): Standard error from execution
            - summary (str): Short description of changes
    
    Raises:
        FileNotFoundError: If dataset file doesn't exist
        ValueError: If code contains forbidden imports
        Exception: For execution errors or timeout
    """
    try:
        # Validate code safety
        validate_code_safety(code)
        
        # Load the dataset
        df = load_dataset(dataset_id)
        original_shape = df.shape
        
        # Create the execution script with dataset access
        execution_script = f"""
import pandas as pd
import numpy as np
import json
import math
from datetime import datetime

# Load the dataset
df = pd.read_parquet('uploads/{dataset_id}.parquet')

# User's code
{code}

# Save the modified dataset if it was changed
if 'df' in locals() and isinstance(df, pd.DataFrame):
    new_dataset_id = '{str(uuid.uuid4())}'
    df.to_parquet(f'uploads/{{new_dataset_id}}.parquet', index=False)
    print(f"NEW_DATASET_ID:{{new_dataset_id}}")
    print(f"NEW_SHAPE:{{df.shape}}")
else:
    print("NEW_DATASET_ID:null")
    print("NEW_SHAPE:unchanged")
"""
        
        # Create temporary file for the execution script
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(execution_script)
            temp_file_path = temp_file.name
        
        try:
            # Execute the script with timeout
            result = subprocess.run(
                [sys.executable, temp_file_path],
                capture_output=True,
                text=True,
                timeout=5,  # 5 second timeout
                cwd=os.getcwd()
            )
            
            # Parse the output to extract new dataset ID and shape info
            stdout_lines = result.stdout.split('\n')
            new_dataset_id = None
            new_shape = None
            
            for line in stdout_lines:
                if line.startswith('NEW_DATASET_ID:'):
                    dataset_id_value = line.split(':', 1)[1].strip()
                    if dataset_id_value != 'null':
                        new_dataset_id = dataset_id_value
                elif line.startswith('NEW_SHAPE:'):
                    shape_info = line.split(':', 1)[1].strip()
                    if shape_info != 'unchanged':
                        new_shape = shape_info
            
            # Generate summary
            if new_dataset_id:
                summary = f"Dataset processed: {original_shape} -> {new_shape}" if new_shape else "Dataset processed and saved"
            else:
                summary = "Code executed on dataset (no modifications saved)"
            
            return {
                "status": "success" if result.returncode == 0 else "error",
                "newDatasetId": new_dataset_id,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "summary": summary
            }
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass  # File might already be deleted
                
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "newDatasetId": None,
            "stdout": "",
            "stderr": "Code execution timed out after 5 seconds",
            "summary": "Execution failed due to timeout"
        }
    except FileNotFoundError as e:
        return {
            "status": "error",
            "newDatasetId": None,
            "stdout": "",
            "stderr": str(e),
            "summary": "Dataset not found"
        }
    except ValueError as e:
        return {
            "status": "error",
            "newDatasetId": None,
            "stdout": "",
            "stderr": str(e),
            "summary": "Code validation failed"
        }
    except Exception as e:
        return {
            "status": "error",
            "newDatasetId": None,
            "stdout": "",
            "stderr": f"Error executing Python code: {str(e)}",
            "summary": "Execution failed"
        }
