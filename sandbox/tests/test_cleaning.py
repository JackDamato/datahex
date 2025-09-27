"""
Tests for Data Cleaning Tools

This module contains unit tests for the cleaning functionality.
"""

import pytest
import pandas as pd
import os
import tempfile
from pathlib import Path
from tools.cleaning import drop_nulls, get_dataset_info


class TestCleaningTools:
    """Test cases for data cleaning tools."""
    
    def setup_method(self):
        """Set up test data before each test."""
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Create test data with nulls (matching the actual test data)
        self.test_data = pd.DataFrame({
            'name': ['Alice', 'Bob', None, 'Diana', 'Eve', 'Frank', None, 'Grace'],
            'age': [25, 30, None, 35, 28, 42, 33, None],
            'salary': [50000, 60000, 70000, None, 55000, 80000, 65000, 45000],
            'department': ['IT', 'HR', 'IT', 'Finance', None, 'IT', 'HR', 'Finance'],
            'experience_years': [2, 5, None, 8, 3, 12, 6, 1],
            'performance_score': [85, 92, None, 78, 88, 95, 90, 82]
        })
        
        # Save test data as parquet
        self.test_dataset_id = "test_dataset"
        self.test_parquet_path = f"uploads/{self.test_dataset_id}.parquet"
        self.test_data.to_parquet(self.test_parquet_path, index=False)
    
    def teardown_method(self):
        """Clean up after each test."""
        # Remove test files
        if os.path.exists(self.test_parquet_path):
            os.remove(self.test_parquet_path)
        
        # Clean up any generated files
        for file in os.listdir("uploads"):
            if file.startswith("test_") or file.endswith(".parquet"):
                try:
                    os.remove(f"uploads/{file}")
                except:
                    pass
    
    def test_drop_nulls_all_columns(self):
        """Test drop_nulls function with all columns."""
        result = drop_nulls(self.test_dataset_id)
        
        # Check that result has expected keys
        assert 'newDatasetId' in result
        assert 'rows' in result
        
        # Check that output file exists
        new_parquet_path = f"uploads/{result['newDatasetId']}.parquet"
        assert os.path.exists(new_parquet_path)
        
        # Check dimensions - should have 3 rows (Alice, Bob, Frank without any nulls)
        assert result['rows'] == 3
        
        # Verify the cleaned data
        cleaned_df = pd.read_parquet(new_parquet_path)
        assert len(cleaned_df) == 3
        assert 'Alice' in cleaned_df['name'].values
        assert 'Bob' in cleaned_df['name'].values
        assert 'Frank' in cleaned_df['name'].values
    
    def test_drop_nulls_specific_columns(self):
        """Test drop_nulls function with specific columns."""
        result = drop_nulls(self.test_dataset_id, columns=['name', 'age'])
        
        # Check that result has expected keys
        assert 'newDatasetId' in result
        assert 'rows' in result
        
        # Check that output file exists
        new_parquet_path = f"uploads/{result['newDatasetId']}.parquet"
        assert os.path.exists(new_parquet_path)
        
        # Check dimensions - should have 5 rows (Alice, Bob, Diana, Eve, Frank)
        assert result['rows'] == 5
        
        # Verify the cleaned data
        cleaned_df = pd.read_parquet(new_parquet_path)
        assert len(cleaned_df) == 5
        assert 'Alice' in cleaned_df['name'].values
        assert 'Bob' in cleaned_df['name'].values
        assert 'Diana' in cleaned_df['name'].values
        assert 'Eve' in cleaned_df['name'].values
        assert 'Frank' in cleaned_df['name'].values
    
    def test_drop_nulls_nonexistent_dataset(self):
        """Test drop_nulls function with nonexistent dataset."""
        with pytest.raises(FileNotFoundError):
            drop_nulls("nonexistent_dataset")
    
    def test_drop_nulls_invalid_columns(self):
        """Test drop_nulls function with invalid columns."""
        with pytest.raises(ValueError):
            drop_nulls(self.test_dataset_id, columns=['invalid_column'])
    
    def test_get_dataset_info(self):
        """Test get_dataset_info function."""
        info = get_dataset_info(self.test_dataset_id)
        
        # Check that info has expected keys
        assert 'rows' in info
        assert 'columns' in info
        assert 'column_names' in info
        assert 'dtypes' in info
        assert 'memory_usage' in info
        assert 'null_counts' in info
        
        # Check values
        assert info['rows'] == 8
        assert info['columns'] == 6
        assert set(info['column_names']) == {'name', 'age', 'salary', 'department', 'experience_years', 'performance_score'}
    
    def test_get_dataset_info_nonexistent_dataset(self):
        """Test get_dataset_info function with nonexistent dataset."""
        with pytest.raises(FileNotFoundError):
            get_dataset_info("nonexistent_dataset")