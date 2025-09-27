#!/usr/bin/env python3
"""
Comprehensive tests for Commit 06 endpoints
Tests both /mcp/clean/drop_nulls and /mcp/runtime/execute_python endpoints
"""

import pytest
import pandas as pd
import tempfile
import os
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app
from tools.cleaning import drop_nulls
from tools.runtime import execute_python_on_dataset

class TestCommit06Endpoints:
    """Test suite for Commit 06 MCP endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Set up test environment before each test"""
        # Create uploads directory
        self.uploads_dir = Path("uploads")
        self.uploads_dir.mkdir(exist_ok=True)
        
        # Create test dataset
        self.test_data = {
            'name': ['Alice', 'Bob', None, 'Charlie', 'David'],
            'age': [25, 30, None, 35, 40],
            'salary': [50000, None, 70000, 80000, 90000],
            'department': ['IT', 'HR', 'IT', 'Finance', 'IT']
        }
        self.df = pd.DataFrame(self.test_data)
        self.test_dataset_id = "test_commit06_dataset"
        self.test_file = self.uploads_dir / f"{self.test_dataset_id}.parquet"
        self.df.to_parquet(self.test_file, index=False)
        
        yield
        
        # Cleanup
        if self.test_file.exists():
            self.test_file.unlink()
        
        # Clean up any generated files
        for file in self.uploads_dir.glob("*.parquet"):
            if file.name.startswith("test_"):
                file.unlink()

    def test_drop_nulls_endpoint_all_columns(self):
        """Test drop_nulls endpoint with all columns"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/clean/drop_nulls", json={
            "dataset_id": self.test_dataset_id,
            "columns": None
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have newDatasetId and rows
        assert "newDatasetId" in data
        assert "rows" in data
        assert data["rows"] == 3  # 3 rows without any nulls (Alice, Charlie, David)
        
        # Verify new file was created
        new_file = self.uploads_dir / f"{data['newDatasetId']}.parquet"
        assert new_file.exists()
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        assert len(new_df) == 3  # Alice, Charlie, David (rows without any nulls)
        assert new_df.isnull().sum().sum() == 0  # No nulls
        
        # Cleanup
        new_file.unlink()

    def test_drop_nulls_endpoint_specific_columns(self):
        """Test drop_nulls endpoint with specific columns"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/clean/drop_nulls", json={
            "dataset_id": self.test_dataset_id,
            "columns": ["name", "age"]
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have newDatasetId and rows
        assert "newDatasetId" in data
        assert "rows" in data
        assert data["rows"] == 4  # 4 rows without nulls in name and age (Alice, Bob, Charlie, David)
        
        # Verify new file was created
        new_file = self.uploads_dir / f"{data['newDatasetId']}.parquet"
        assert new_file.exists()
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        assert len(new_df) == 4  # Alice, Bob, Charlie, David (rows without nulls in name and age)
        assert new_df[["name", "age"]].isnull().sum().sum() == 0  # No nulls in specified columns
        
        # Cleanup
        new_file.unlink()

    def test_drop_nulls_endpoint_missing_dataset(self):
        """Test drop_nulls endpoint with missing dataset"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/clean/drop_nulls", json={
            "dataset_id": "nonexistent_dataset",
            "columns": None
        })
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()

    def test_execute_python_endpoint_simple_operation(self):
        """Test execute_python endpoint with simple operation"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/runtime/execute_python", json={
            "datasetId": self.test_dataset_id,
            "code": """
# Add a new column
df['age_group'] = df['age'].apply(lambda x: 'Young' if x < 30 else 'Old' if x < 40 else 'Senior')
print(f"Added age_group column. Shape: {df.shape}")
"""
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have all required fields
        assert "status" in data
        assert "newDatasetId" in data
        assert "stdout" in data
        assert "stderr" in data
        assert "summary" in data
        
        assert data["status"] == "success"
        assert data["newDatasetId"] is not None
        
        # Verify new file was created
        new_file = self.uploads_dir / f"{data['newDatasetId']}.parquet"
        assert new_file.exists()
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        assert len(new_df) == 5  # Same number of rows
        assert "age_group" in new_df.columns
        
        # Cleanup
        new_file.unlink()

    def test_execute_python_endpoint_data_filtering(self):
        """Test execute_python endpoint with data filtering"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/runtime/execute_python", json={
            "datasetId": self.test_dataset_id,
            "code": """
# Filter data
df = df[df['age'] > 30]
print(f"Filtered to {len(df)} rows")
"""
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert data["newDatasetId"] is not None
        
        # Verify new file was created
        new_file = self.uploads_dir / f"{data['newDatasetId']}.parquet"
        assert new_file.exists()
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        assert len(new_df) == 2  # Only 2 rows with age > 30
        assert (new_df['age'] > 30).all()
        
        # Cleanup
        new_file.unlink()

    def test_execute_python_endpoint_forbidden_import(self):
        """Test execute_python endpoint with forbidden import"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/runtime/execute_python", json={
            "datasetId": self.test_dataset_id,
            "code": """
import os
print("This should fail")
"""
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "error"
        assert "Forbidden import" in data["stderr"]
        assert data["newDatasetId"] is None

    def test_execute_python_endpoint_missing_dataset(self):
        """Test execute_python endpoint with missing dataset"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/runtime/execute_python", json={
            "datasetId": "nonexistent_dataset",
            "code": "print('Hello')"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "error"
        assert "not found" in data["stderr"].lower()
        assert data["newDatasetId"] is None

    def test_execute_python_endpoint_timeout(self):
        """Test execute_python endpoint with timeout"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/runtime/execute_python", json={
            "datasetId": self.test_dataset_id,
            "code": """
import time
time.sleep(10)  # This should timeout
print("This should not print")
"""
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "error"
        assert "timed out" in data["stderr"].lower()
        assert data["newDatasetId"] is None

    def test_execute_python_endpoint_read_only_operation(self):
        """Test execute_python endpoint with read-only operation"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post("/mcp/runtime/execute_python", json={
            "datasetId": self.test_dataset_id,
            "code": """
# Just read and analyze data
print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"Age statistics: {df['age'].describe()}")
"""
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        # Note: Even read-only operations create a new dataset due to our implementation
        assert data["newDatasetId"] is not None
        assert "Dataset shape" in data["stdout"]
        assert "Columns" in data["stdout"]

    def test_tools_endpoint(self):
        """Test tools endpoint returns correct tools"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.get("/mcp/tools")
        
        assert response.status_code == 200
        tools = response.json()
        
        # Should include our tools
        tool_names = [tool["name"] for tool in tools]
        assert "drop_nulls" in tool_names
        assert "runtime.execute_python" in tool_names

    def test_health_endpoint(self):
        """Test health endpoint"""
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "ok"
        assert "message" in data

    def test_drop_nulls_direct_function(self):
        """Test drop_nulls function directly"""
        result = drop_nulls(self.test_dataset_id, ["name", "age"])
        
        assert "newDatasetId" in result
        assert "rows" in result
        assert "summary" in result
        assert result["rows"] == 4  # 4 rows without nulls in name and age
        
        # Verify new file was created
        new_file = self.uploads_dir / f"{result['newDatasetId']}.parquet"
        assert new_file.exists()
        
        # Cleanup
        new_file.unlink()

    def test_execute_python_on_dataset_direct_function(self):
        """Test execute_python_on_dataset function directly"""
        result = execute_python_on_dataset(
            self.test_dataset_id,
            "df['new_col'] = df['age'] * 2; print(f'Added new_col. Shape: {df.shape}')"
        )
        
        assert result["status"] == "success"
        assert result["newDatasetId"] is not None
        assert "Added new_col" in result["stdout"]
        
        # Verify new file was created
        new_file = self.uploads_dir / f"{result['newDatasetId']}.parquet"
        assert new_file.exists()
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        assert "new_col" in new_df.columns
        # Handle null values in age column
        valid_rows = new_df["age"].notna()
        assert (new_df.loc[valid_rows, "new_col"] == new_df.loc[valid_rows, "age"] * 2).all()
        
        # Cleanup
        new_file.unlink()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
