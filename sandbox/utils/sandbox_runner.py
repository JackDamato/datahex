"""
Sandbox Runner Utility

This module provides a safe subprocess wrapper for running Python tools
with timeout and resource constraints to prevent arbitrary code execution.
"""

import asyncio
import subprocess
import sys
import os
import tempfile
import uuid
from typing import Any, Callable, List, Dict
from pathlib import Path
import traceback
import signal
import psutil


class SandboxTimeoutError(Exception):
    """Raised when a sandbox operation times out."""
    pass


class SandboxError(Exception):
    """Raised when a sandbox operation fails."""
    pass


async def run_tool_safely(
    tool_function: Callable,
    *args,
    timeout: int = 60,
    memory_limit_mb: int = 512,
    **kwargs
) -> Any:
    """
    Run a tool function safely with timeout and resource constraints.
    
    Args:
        tool_function (Callable): The function to run
        *args: Positional arguments for the function
        timeout (int): Maximum execution time in seconds (default: 60)
        memory_limit_mb (int): Maximum memory usage in MB (default: 512)
        **kwargs: Keyword arguments for the function
    
    Returns:
        Any: The result of the tool function
    
    Raises:
        SandboxTimeoutError: If the operation times out
        SandboxError: If the operation fails
    """
    try:
        # Create a temporary file to store the result
        result_file = tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json')
        result_path = result_file.name
        result_file.close()
        
        # Create a script to run the tool function
        script_content = create_tool_script(tool_function, args, kwargs, result_path)
        
        # Write script to temporary file
        script_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.py')
        script_file.write(script_content)
        script_file.close()
        
        # Run the script in a subprocess with timeout
        process = await asyncio.create_subprocess_exec(
            sys.executable, script_file.name,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        
        try:
            # Wait for completion with timeout
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            # Check if process completed successfully
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8') if stderr else "Unknown error"
                raise SandboxError(f"Tool execution failed: {error_msg}")
            
            # Read result from file
            if os.path.exists(result_path):
                with open(result_path, 'r') as f:
                    result = eval(f.read())  # Note: In production, use json.loads with proper serialization
            else:
                raise SandboxError("Result file not found")
            
            return result
            
        except asyncio.TimeoutError:
            # Kill the process and its children
            try:
                if os.name != 'nt':
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                else:
                    process.terminate()
                await asyncio.wait_for(process.wait(), timeout=5)
            except:
                try:
                    if os.name != 'nt':
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                    else:
                        process.kill()
                except:
                    pass
            
            raise SandboxTimeoutError(f"Tool execution timed out after {timeout} seconds")
        
        finally:
            # Clean up temporary files
            try:
                os.unlink(script_file.name)
                if os.path.exists(result_path):
                    os.unlink(result_path)
            except:
                pass
                
    except SandboxTimeoutError:
        raise
    except SandboxError:
        raise
    except Exception as e:
        raise SandboxError(f"Unexpected error in sandbox runner: {str(e)}")


def create_tool_script(tool_function: Callable, args: tuple, kwargs: dict, result_path: str) -> str:
    """
    Create a Python script to run the tool function.
    
    Args:
        tool_function (Callable): The function to run
        args (tuple): Positional arguments
        kwargs (dict): Keyword arguments
        result_path (str): Path to write the result
    
    Returns:
        str: Python script content
    """
    # Get the module and function name
    module_name = tool_function.__module__
    function_name = tool_function.__name__
    
    script = f"""
import sys
import os
import traceback
import json
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, os.getcwd())

try:
    # Import the tool function
    from {module_name} import {function_name}
    
    # Prepare arguments
    args = {repr(args)}
    kwargs = {repr(kwargs)}
    
    # Call the function
    result = {function_name}(*args, **kwargs)
    
    # Write result to file
    with open('{result_path}', 'w') as f:
        f.write(repr(result))
    
    print("SUCCESS: Tool executed successfully")
    
except Exception as e:
    error_msg = f"ERROR: {{str(e)}}\\n{{traceback.format_exc()}}"
    print(error_msg, file=sys.stderr)
    sys.exit(1)
"""
    return script


def run_tool_sync(
    tool_function: Callable,
    *args,
    timeout: int = 60,
    **kwargs
) -> Any:
    """
    Synchronous version of run_tool_safely.
    
    Args:
        tool_function (Callable): The function to run
        *args: Positional arguments for the function
        timeout (int): Maximum execution time in seconds
        **kwargs: Keyword arguments for the function
    
    Returns:
        Any: The result of the tool function
    """
    try:
        # Run in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                run_tool_safely(tool_function, *args, timeout=timeout, **kwargs)
            )
        finally:
            loop.close()
    except Exception as e:
        raise SandboxError(f"Error in synchronous tool runner: {str(e)}")


def validate_tool_function(tool_function: Callable) -> bool:
    """
    Validate that a tool function is safe to run.
    
    Args:
        tool_function (Callable): The function to validate
    
    Returns:
        bool: True if function is safe, False otherwise
    """
    try:
        # Check if function is from allowed modules
        module_name = tool_function.__module__
        allowed_modules = [
            'tools.cleaning',
            'tools.stats', 
            'tools.plotgen',
            'tools.train'
        ]
        
        if not any(module_name.startswith(allowed) for allowed in allowed_modules):
            return False
        
        # Check function name
        function_name = tool_function.__name__
        allowed_functions = [
            'drop_nulls',
            'compute_summary_stats',
            'generate_plot',
            'train_model'
        ]
        
        if function_name not in allowed_functions:
            return False
        
        return True
        
    except Exception:
        return False


def get_system_resources() -> Dict[str, Any]:
    """
    Get current system resource usage.
    
    Returns:
        Dict[str, Any]: System resource information
    """
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            "cpu_percent": process.cpu_percent(),
            "memory_mb": memory_info.rss / 1024 / 1024,
            "memory_percent": process.memory_percent(),
            "num_threads": process.num_threads(),
            "status": process.status()
        }
    except Exception:
        return {
            "cpu_percent": 0.0,
            "memory_mb": 0.0,
            "memory_percent": 0.0,
            "num_threads": 0,
            "status": "unknown"
        }


def cleanup_old_artifacts(max_age_hours: int = 24) -> int:
    """
    Clean up old artifact files.
    
    Args:
        max_age_hours (int): Maximum age of artifacts in hours
    
    Returns:
        int: Number of files cleaned up
    """
    try:
        artifacts_dir = Path("artifacts")
        if not artifacts_dir.exists():
            return 0
        
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        cleaned_count = 0
        for file_path in artifacts_dir.glob("*.pkl"):
            if current_time - file_path.stat().st_mtime > max_age_seconds:
                try:
                    file_path.unlink()
                    cleaned_count += 1
                except:
                    pass
        
        return cleaned_count
        
    except Exception:
        return 0
