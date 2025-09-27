"""
Runtime Tools

This module provides runtime execution functions for the MCP tool server.
Currently implements execute_python functionality for safe code execution.
"""

import subprocess
import tempfile
import os
import sys
from typing import Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
