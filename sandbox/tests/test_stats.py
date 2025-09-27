"""
Tests for statistical analysis tools.

This module contains unit tests for the stats.py module.
"""

import pytest
import pandas as pd
import numpy as np
import os
import tempfile
from pathlib import Path
import sys

# Add the parent directory to the path so we can import the tools
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools.stats import compute_summary_stats, generate_histogram, load_dataset, compute_correlation_matrix, detect_outliers


class TestStatsTools:
    """Test class for statistical analysis tools."""
    
    def setup_method(self):
        """Set up test data before each test method."""
        # Create a temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create test data
        np.random.seed(42)
        self.test_data = pd.DataFrame({
            'name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'],
            'age': [25, 30, 35, 28, 32, 29, 27, 31, 26, 33],
            'salary': [50000, 60000, 70000, 55000, 65000, 58000, 52000, 62000, 48000, 68000],
            'score': [85, 92, 78, 88, 91, 83, 87, 89, 75, 94],
            'department': ['Engineering', 'Marketing', 'Sales', 'Engineering', 'Marketing', 'Sales', 'Engineering', 'Sales', 'Marketing', 'Engineering']
        })
        
        # Add some null values for testing
        self.test_data.loc[2, 'age'] = np.nan
        self.test_data.loc[5, 'salary'] = np.nan
        self.test_data.loc[8, 'score'] = np.nan
        
        # Save test data to CSV
        self.test_csv_path = os.path.join(self.temp_dir, 'test_data.csv')
        self.test_data.to_csv(self.test_csv_path, index=False)
    
    def teardown_method(self):
        """Clean up after each test method."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_compute_summary_stats_numeric_column(self):
        """Test compute_summary_stats function with numeric column."""
        result = compute_summary_stats(self.test_csv_path, 'age')
        
        # Check that result has expected keys
        assert 'mean' in result
        assert 'median' in result
        assert 'std' in result
        assert 'nullPct' in result
        assert 'histogram' in result
        
        # Check that values are reasonable
        assert isinstance(result['mean'], float)
        assert isinstance(result['median'], float)
        assert isinstance(result['std'], float)
        assert isinstance(result['nullPct'], float)
        assert isinstance(result['histogram'], list)
        
        # Check null percentage (1 null out of 10 values = 10%)
        assert abs(result['nullPct'] - 10.0) < 0.1
        
        # Check histogram structure
        assert len(result['histogram']) == 10  # 10 bins
        for bin_data in result['histogram']:
            assert 'bin_start' in bin_data
            assert 'bin_end' in bin_data
            assert 'count' in bin_data
            assert 'bin_center' in bin_data
    
    def test_compute_summary_stats_nonexistent_file(self):
        """Test compute_summary_stats function with non-existent file."""
        with pytest.raises(FileNotFoundError):
            compute_summary_stats('nonexistent_file.csv', 'age')
    
    def test_compute_summary_stats_nonexistent_column(self):
        """Test compute_summary_stats function with non-existent column."""
        with pytest.raises(KeyError):
            compute_summary_stats(self.test_csv_path, 'nonexistent_column')
    
    def test_compute_summary_stats_non_numeric_column(self):
        """Test compute_summary_stats function with non-numeric column."""
        with pytest.raises(ValueError):
            compute_summary_stats(self.test_csv_path, 'name')
    
    def test_generate_histogram(self):
        """Test generate_histogram function."""
        # Create a simple numeric series
        series = pd.Series([1, 2, 2, 3, 3, 3, 4, 4, 5])
        histogram = generate_histogram(series, bins=5)
        
        # Check histogram structure
        assert len(histogram) == 5
        for bin_data in histogram:
            assert 'bin_start' in bin_data
            assert 'bin_end' in bin_data
            assert 'count' in bin_data
            assert 'bin_center' in bin_data
            assert isinstance(bin_data['count'], int)
    
    def test_generate_histogram_empty_series(self):
        """Test generate_histogram function with empty series."""
        series = pd.Series([])
        histogram = generate_histogram(series, bins=5)
        
        # Should return empty list
        assert histogram == []
    
    def test_load_dataset_csv(self):
        """Test load_dataset function with CSV file."""
        df = load_dataset(self.test_csv_path)
        
        # Check that data is loaded correctly
        assert len(df) == 10
        assert len(df.columns) == 5
        assert 'name' in df.columns
        assert 'age' in df.columns
        assert 'salary' in df.columns
        assert 'score' in df.columns
        assert 'department' in df.columns
    
    def test_load_dataset_invalid_format(self):
        """Test load_dataset function with invalid file format."""
        # Create a text file
        txt_path = os.path.join(self.temp_dir, 'test.txt')
        with open(txt_path, 'w') as f:
            f.write("This is not a CSV file")
        
        with pytest.raises(ValueError):
            load_dataset(txt_path)
    
    def test_compute_correlation_matrix(self):
        """Test compute_correlation_matrix function."""
        result = compute_correlation_matrix(self.test_csv_path, ['age', 'salary', 'score'])
        
        # Check that result has expected keys
        assert 'columns' in result
        assert 'matrix' in result
        assert 'summary' in result
        
        # Check columns
        assert 'age' in result['columns']
        assert 'salary' in result['columns']
        assert 'score' in result['columns']
        
        # Check matrix structure
        matrix = result['matrix']
        assert 'age' in matrix
        assert 'salary' in matrix
        assert 'score' in matrix
        
        # Check summary
        summary = result['summary']
        assert 'max_correlation' in summary
        assert 'min_correlation' in summary
        assert 'high_correlations' in summary
    
    def test_compute_correlation_matrix_insufficient_columns(self):
        """Test compute_correlation_matrix function with insufficient columns."""
        with pytest.raises(ValueError):
            compute_correlation_matrix(self.test_csv_path, ['age'])
    
    def test_detect_outliers_iqr(self):
        """Test detect_outliers function with IQR method."""
        result = detect_outliers(self.test_csv_path, 'salary', method='iqr')
        
        # Check that result has expected keys
        assert 'column' in result
        assert 'method' in result
        assert 'outlier_count' in result
        assert 'outlier_percentage' in result
        assert 'outlier_values' in result
        assert 'bounds' in result
        
        # Check values
        assert result['column'] == 'salary'
        assert result['method'] == 'iqr'
        assert isinstance(result['outlier_count'], int)
        assert isinstance(result['outlier_percentage'], float)
        assert isinstance(result['outlier_values'], list)
        assert 'lower' in result['bounds']
        assert 'upper' in result['bounds']
    
    def test_detect_outliers_zscore(self):
        """Test detect_outliers function with Z-score method."""
        result = detect_outliers(self.test_csv_path, 'score', method='zscore')
        
        # Check that result has expected keys
        assert 'column' in result
        assert 'method' in result
        assert 'outlier_count' in result
        assert 'outlier_percentage' in result
        assert 'outlier_values' in result
        
        # Check values
        assert result['column'] == 'score'
        assert result['method'] == 'zscore'
        assert isinstance(result['outlier_count'], int)
        assert isinstance(result['outlier_percentage'], float)
        assert isinstance(result['outlier_values'], list)
    
    def test_detect_outliers_invalid_method(self):
        """Test detect_outliers function with invalid method."""
        with pytest.raises(ValueError):
            detect_outliers(self.test_csv_path, 'salary', method='invalid')
    
    def test_detect_outliers_nonexistent_column(self):
        """Test detect_outliers function with non-existent column."""
        with pytest.raises(KeyError):
            detect_outliers(self.test_csv_path, 'nonexistent_column')
    
    def test_detect_outliers_non_numeric_column(self):
        """Test detect_outliers function with non-numeric column."""
        with pytest.raises(ValueError):
            detect_outliers(self.test_csv_path, 'name')
    
    def test_compute_summary_stats_all_nulls(self):
        """Test compute_summary_stats function with column containing all nulls."""
        # Create dataset with all nulls in one column
        all_nulls_data = pd.DataFrame({
            'name': ['Alice', 'Bob', 'Charlie'],
            'age': [25, 30, 35],
            'all_nulls': [np.nan, np.nan, np.nan]
        })
        all_nulls_csv_path = os.path.join(self.temp_dir, 'all_nulls.csv')
        all_nulls_data.to_csv(all_nulls_csv_path, index=False)
        
        result = compute_summary_stats(all_nulls_csv_path, 'all_nulls')
        
        # Check that null percentage is 100%
        assert abs(result['nullPct'] - 100.0) < 0.1
        
        # Check that other statistics are 0
        assert result['mean'] == 0.0
        assert result['median'] == 0.0
        assert result['std'] == 0.0
    
    def test_compute_summary_stats_no_nulls(self):
        """Test compute_summary_stats function with column containing no nulls."""
        # Should raise ValueError because name is not numeric
        with pytest.raises(ValueError):
            compute_summary_stats(self.test_csv_path, 'name')


if __name__ == '__main__':
    pytest.main([__file__])
