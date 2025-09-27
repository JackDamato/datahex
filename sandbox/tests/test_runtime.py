"""
Tests for Runtime Tools

This module contains unit tests for the runtime execution functionality.
"""

import pytest
from tools.runtime import execute_python


class TestRuntimeTools:
    """Test cases for runtime execution tools."""
    
    def test_execute_python_simple_print(self):
        """Test execute_python with simple print statement."""
        result = execute_python('print("hi")')
        
        # Check that result has expected keys
        assert 'stdout' in result
        assert 'stderr' in result
        assert 'returncode' in result
        
        # Check values
        assert result['stdout'].strip() == "hi"
        assert result['stderr'] == ""
        assert result['returncode'] == 0
    
    def test_execute_python_math_operation(self):
        """Test execute_python with math operation."""
        result = execute_python('print(2 + 3)')
        
        assert result['stdout'].strip() == "5"
        assert result['returncode'] == 0
    
    def test_execute_python_error(self):
        """Test execute_python with code that produces an error."""
        result = execute_python('print(undefined_variable)')
        
        assert result['returncode'] != 0
        assert "NameError" in result['stderr'] or "undefined_variable" in result['stderr']
    
    def test_execute_python_import(self):
        """Test execute_python with import statement."""
        result = execute_python('import math; print(math.pi)')
        
        assert "3.14159" in result['stdout']
        assert result['returncode'] == 0
    
    def test_execute_python_timeout(self):
        """Test execute_python with code that would timeout."""
        # This test might be flaky, so we'll use a simple infinite loop
        with pytest.raises(Exception) as exc_info:
            execute_python('while True: pass')
        
        assert "timed out" in str(exc_info.value).lower()
    
    def test_execute_python_empty_code(self):
        """Test execute_python with empty code."""
        result = execute_python('')
        
        assert result['stdout'] == ""
        assert result['stderr'] == ""
        assert result['returncode'] == 0
