"""
Tests for plot generation tools.

This module contains unit tests for the plotgen.py module.
"""

import pytest
import pandas as pd
import numpy as np
import os
import tempfile
from pathlib import Path
import sys
import json

# Add the parent directory to the path so we can import the tools
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools.plotgen import generate_plot, generate_histogram_plot, generate_scatter_plot, generate_heatmap_plot, load_dataset


class TestPlotGenTools:
    """Test class for plot generation tools."""
    
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
        
        # Save test data to CSV
        self.test_csv_path = os.path.join(self.temp_dir, 'test_data.csv')
        self.test_data.to_csv(self.test_csv_path, index=False)
    
    def teardown_method(self):
        """Clean up after each test method."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_generate_histogram_plot(self):
        """Test generate_histogram_plot function."""
        result = generate_histogram_plot(self.test_data, ['age'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
        
        # Check data structure
        data = result['data']
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check layout structure
        layout = result['layout']
        assert 'title' in layout
        assert 'xaxis' in layout
        assert 'yaxis' in layout
    
    def test_generate_histogram_plot_multiple_columns(self):
        """Test generate_histogram_plot function with multiple columns."""
        result = generate_histogram_plot(self.test_data, ['age', 'salary', 'score'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
        
        # Check data structure
        data = result['data']
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_generate_histogram_plot_no_numeric_columns(self):
        """Test generate_histogram_plot function with no numeric columns."""
        with pytest.raises(ValueError):
            generate_histogram_plot(self.test_data, ['name', 'department'])
    
    def test_generate_scatter_plot(self):
        """Test generate_scatter_plot function."""
        result = generate_scatter_plot(self.test_data, ['age', 'salary'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
        
        # Check data structure
        data = result['data']
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that scatter plot has x and y data
        scatter_trace = data[0]
        assert 'x' in scatter_trace
        assert 'y' in scatter_trace
        assert 'mode' in scatter_trace
        assert scatter_trace['mode'] == 'markers'
    
    def test_generate_scatter_plot_insufficient_columns(self):
        """Test generate_scatter_plot function with insufficient columns."""
        with pytest.raises(ValueError):
            generate_scatter_plot(self.test_data, ['age'])
    
    def test_generate_scatter_plot_no_numeric_columns(self):
        """Test generate_scatter_plot function with no numeric columns."""
        with pytest.raises(ValueError):
            generate_scatter_plot(self.test_data, ['name', 'department'])
    
    def test_generate_heatmap_plot(self):
        """Test generate_heatmap_plot function."""
        result = generate_heatmap_plot(self.test_data, ['age', 'salary', 'score'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
        
        # Check data structure
        data = result['data']
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that heatmap has z, x, y data
        heatmap_trace = data[0]
        assert 'z' in heatmap_trace
        assert 'x' in heatmap_trace
        assert 'y' in heatmap_trace
        assert 'type' in heatmap_trace
        assert heatmap_trace['type'] == 'heatmap'
    
    def test_generate_heatmap_plot_insufficient_columns(self):
        """Test generate_heatmap_plot function with insufficient columns."""
        with pytest.raises(ValueError):
            generate_heatmap_plot(self.test_data, ['age'])
    
    def test_generate_heatmap_plot_no_numeric_columns(self):
        """Test generate_heatmap_plot function with no numeric columns."""
        with pytest.raises(ValueError):
            generate_heatmap_plot(self.test_data, ['name', 'department'])
    
    def test_generate_plot_histogram(self):
        """Test generate_plot function with histogram type."""
        result = generate_plot(self.test_csv_path, 'histogram', ['age'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
    
    def test_generate_plot_scatter(self):
        """Test generate_plot function with scatter type."""
        result = generate_plot(self.test_csv_path, 'scatter', ['age', 'salary'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
    
    def test_generate_plot_heatmap(self):
        """Test generate_plot function with heatmap type."""
        result = generate_plot(self.test_csv_path, 'heatmap', ['age', 'salary', 'score'])
        
        # Check that result is a valid Plotly figure dictionary
        assert isinstance(result, dict)
        assert 'data' in result
        assert 'layout' in result
    
    def test_generate_plot_invalid_type(self):
        """Test generate_plot function with invalid plot type."""
        with pytest.raises(ValueError):
            generate_plot(self.test_csv_path, 'invalid_type', ['age'])
    
    def test_generate_plot_nonexistent_file(self):
        """Test generate_plot function with non-existent file."""
        with pytest.raises(FileNotFoundError):
            generate_plot('nonexistent_file.csv', 'histogram', ['age'])
    
    def test_generate_plot_nonexistent_columns(self):
        """Test generate_plot function with non-existent columns."""
        with pytest.raises(ValueError):
            generate_plot(self.test_csv_path, 'histogram', ['nonexistent_column'])
    
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
    
    def test_plot_json_structure(self):
        """Test that generated plots have proper JSON structure."""
        result = generate_plot(self.test_csv_path, 'histogram', ['age'])
        
        # Check that the result can be serialized to JSON
        json_str = json.dumps(result)
        assert isinstance(json_str, str)
        
        # Check that it can be deserialized back
        parsed_result = json.loads(json_str)
        assert isinstance(parsed_result, dict)
        assert 'data' in parsed_result
        assert 'layout' in parsed_result
    
    def test_histogram_plot_data_structure(self):
        """Test that histogram plot has proper data structure."""
        result = generate_histogram_plot(self.test_data, ['age'])
        
        data = result['data']
        assert len(data) > 0
        
        # Check first trace
        trace = data[0]
        assert 'x' in trace
        assert 'type' in trace
        assert trace['type'] == 'histogram'
    
    def test_scatter_plot_data_structure(self):
        """Test that scatter plot has proper data structure."""
        result = generate_scatter_plot(self.test_data, ['age', 'salary'])
        
        data = result['data']
        assert len(data) > 0
        
        # Check first trace
        trace = data[0]
        assert 'x' in trace
        assert 'y' in trace
        assert 'mode' in trace
        assert trace['mode'] == 'markers'
    
    def test_heatmap_plot_data_structure(self):
        """Test that heatmap plot has proper data structure."""
        result = generate_heatmap_plot(self.test_data, ['age', 'salary', 'score'])
        
        data = result['data']
        assert len(data) > 0
        
        # Check first trace
        trace = data[0]
        assert 'z' in trace
        assert 'x' in trace
        assert 'y' in trace
        assert 'type' in trace
        assert trace['type'] == 'heatmap'
    
    def test_empty_dataset_handling(self):
        """Test handling of empty datasets."""
        # Create empty dataset
        empty_data = pd.DataFrame()
        empty_csv_path = os.path.join(self.temp_dir, 'empty.csv')
        empty_data.to_csv(empty_csv_path, index=False)
        
        # Should handle empty dataset gracefully
        with pytest.raises(ValueError):
            generate_plot(empty_csv_path, 'histogram', ['age'])


if __name__ == '__main__':
    pytest.main([__file__])
