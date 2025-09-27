"""
Tests for data cleaning tools.

This module contains unit tests for the cleaning.py module.
"""

import pytest
import pandas as pd
import os
import tempfile
from pathlib import Path
import sys

# Add the parent directory to the path so we can import the tools
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools.cleaning import drop_nulls, validate_dataset_format, get_dataset_info


class TestCleaningTools:
    """Test class for cleaning tools."""
    
    def setup_method(self):
        """Set up test data before each test method."""
        # Create a temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create test data with nulls
        self.test_data = pd.DataFrame({
            'name': ['Alice', 'Bob', None, 'Diana', 'Eve'],
            'age': [25, 30, None, 28, 32],
            'salary': [50000, 60000, 70000, None, 65000],
            'department': ['Engineering', 'Marketing', 'Sales', 'Engineering', None]
        })
        
        # Save test data to CSV
        self.test_csv_path = os.path.join(self.temp_dir, 'test_data.csv')
        self.test_data.to_csv(self.test_csv_path, index=False)
    
    def teardown_method(self):
        """Clean up after each test method."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_drop_nulls_all_columns(self):
        """Test drop_nulls function with all columns."""
        result = drop_nulls(self.test_csv_path)
        
        # Check that result has expected keys
        assert 'newDatasetPath' in result
        assert 'rows' in result
        assert 'columns' in result
        assert 'summary' in result
        
        # Check that output file exists
        assert os.path.exists(result['newDatasetPath'])
        
        # Check dimensions
        assert result['rows'] == 2  # Alice and Bob rows without nulls
        assert result['columns'] == 4
        
        # Verify the cleaned data
        cleaned_df = pd.read_csv(result['newDatasetPath'])
        assert len(cleaned_df) == 2
        assert 'Alice' in cleaned_df['name'].values
        assert 'Bob' in cleaned_df['name'].values
    
    def test_drop_nulls_specific_columns(self):
        """Test drop_nulls function with specific columns."""
        result = drop_nulls(self.test_csv_path, columns=['name', 'age'])
        
        # Check that result has expected keys
        assert 'newDatasetPath' in result
        assert 'rows' in result
        assert 'columns' in result
        assert 'summary' in result
        
        # Check that output file exists
        assert os.path.exists(result['newDatasetPath'])
        
        # Check dimensions - should have 4 rows (Alice, Bob, Diana, Eve)
        assert result['rows'] == 4
        assert result['columns'] == 4
        
        # Verify the cleaned data
        cleaned_df = pd.read_csv(result['newDatasetPath'])
        assert len(cleaned_df) == 4
        assert 'Alice' in cleaned_df['name'].values
        assert 'Bob' in cleaned_df['name'].values
        assert 'Diana' in cleaned_df['name'].values
        assert 'Eve' in cleaned_df['name'].values
    
    def test_drop_nulls_nonexistent_file(self):
        """Test drop_nulls function with non-existent file."""
        with pytest.raises(FileNotFoundError):
            drop_nulls('nonexistent_file.csv')
    
    def test_drop_nulls_invalid_columns(self):
        """Test drop_nulls function with invalid columns."""
        with pytest.raises(ValueError):
            drop_nulls(self.test_csv_path, columns=['nonexistent_column'])
    
    def test_validate_dataset_format(self):
        """Test validate_dataset_format function."""
        # Test valid formats
        assert validate_dataset_format('test.csv') == True
        assert validate_dataset_format('test.parquet') == True
        assert validate_dataset_format('test.xlsx') == True
        assert validate_dataset_format('test.xls') == True
        
        # Test invalid formats
        assert validate_dataset_format('test.txt') == False
        assert validate_dataset_format('test.json') == False
        assert validate_dataset_format('test') == False
    
    def test_get_dataset_info(self):
        """Test get_dataset_info function."""
        info = get_dataset_info(self.test_csv_path)
        
        # Check that info has expected keys
        assert 'rows' in info
        assert 'columns' in info
        assert 'column_names' in info
        assert 'dtypes' in info
        assert 'memory_usage' in info
        assert 'null_counts' in info
        
        # Check values
        assert info['rows'] == 5
        assert info['columns'] == 4
        assert info['column_names'] == ['name', 'age', 'salary', 'department']
        assert info['null_counts']['name'] == 1
        assert info['null_counts']['age'] == 1
        assert info['null_counts']['salary'] == 1
        assert info['null_counts']['department'] == 1
    
    def test_get_dataset_info_nonexistent_file(self):
        """Test get_dataset_info function with non-existent file."""
        with pytest.raises(FileNotFoundError):
            get_dataset_info('nonexistent_file.csv')
    
    def test_drop_nulls_empty_dataset(self):
        """Test drop_nulls function with empty dataset."""
        # Create empty dataset
        empty_df = pd.DataFrame()
        empty_csv_path = os.path.join(self.temp_dir, 'empty.csv')
        empty_df.to_csv(empty_csv_path, index=False)
        
        result = drop_nulls(empty_csv_path)
        
        # Check that result has expected keys
        assert 'newDatasetPath' in result
        assert 'rows' in result
        assert 'columns' in result
        assert 'summary' in result
        
        # Check dimensions
        assert result['rows'] == 0
        assert result['columns'] == 0
    
    def test_drop_nulls_no_nulls(self):
        """Test drop_nulls function with dataset containing no nulls."""
        # Create dataset without nulls
        clean_data = pd.DataFrame({
            'name': ['Alice', 'Bob', 'Charlie'],
            'age': [25, 30, 35],
            'salary': [50000, 60000, 70000]
        })
        clean_csv_path = os.path.join(self.temp_dir, 'clean_data.csv')
        clean_data.to_csv(clean_csv_path, index=False)
        
        result = drop_nulls(clean_csv_path)
        
        # Check dimensions - should be unchanged
        assert result['rows'] == 3
        assert result['columns'] == 3
        
        # Verify the data is unchanged
        cleaned_df = pd.read_csv(result['newDatasetPath'])
        pd.testing.assert_frame_equal(cleaned_df, clean_data)
    
    def test_drop_nulls_all_nulls(self):
        """Test drop_nulls function with dataset containing all nulls."""
        # Create dataset with all nulls
        all_nulls_data = pd.DataFrame({
            'name': [None, None, None],
            'age': [None, None, None],
            'salary': [None, None, None]
        })
        all_nulls_csv_path = os.path.join(self.temp_dir, 'all_nulls.csv')
        all_nulls_data.to_csv(all_nulls_csv_path, index=False)
        
        result = drop_nulls(all_nulls_csv_path)
        
        # Check dimensions - should be empty
        assert result['rows'] == 0
        assert result['columns'] == 3


if __name__ == '__main__':
    pytest.main([__file__])
