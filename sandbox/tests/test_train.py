"""
Tests for machine learning training tools.

This module contains unit tests for the train.py module.
"""

import pytest
import pandas as pd
import numpy as np
import os
import tempfile
from pathlib import Path
import sys
import pickle

# Add the parent directory to the path so we can import the tools
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools.train import train_model, prepare_data, create_model, calculate_metrics, save_model_artifact, load_model_artifact, load_dataset


class TestTrainTools:
    """Test class for machine learning training tools."""
    
    def setup_method(self):
        """Set up test data before each test method."""
        # Create a temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create test data for classification
        np.random.seed(42)
        self.classification_data = pd.DataFrame({
            'feature1': np.random.normal(0, 1, 100),
            'feature2': np.random.normal(0, 1, 100),
            'feature3': np.random.normal(0, 1, 100),
            'target': np.random.choice([0, 1], 100)
        })
        
        # Create test data for regression
        self.regression_data = pd.DataFrame({
            'feature1': np.random.normal(0, 1, 100),
            'feature2': np.random.normal(0, 1, 100),
            'feature3': np.random.normal(0, 1, 100),
            'target': np.random.normal(0, 1, 100)
        })
        
        # Save test data to CSV files
        self.classification_csv_path = os.path.join(self.temp_dir, 'classification_data.csv')
        self.regression_csv_path = os.path.join(self.temp_dir, 'regression_data.csv')
        
        self.classification_data.to_csv(self.classification_csv_path, index=False)
        self.regression_data.to_csv(self.regression_csv_path, index=False)
    
    def teardown_method(self):
        """Clean up after each test method."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_train_model_classification(self):
        """Test train_model function with classification."""
        result = train_model(
            self.classification_csv_path,
            ['feature1', 'feature2', 'feature3'],
            'target',
            'classification'
        )
        
        # Check that result has expected keys
        assert 'metrics' in result
        assert 'artifactPath' in result
        
        # Check metrics structure
        metrics = result['metrics']
        assert 'accuracy' in metrics
        assert 'precision' in metrics
        assert 'recall' in metrics
        assert 'f1_score' in metrics
        
        # Check that metrics are valid
        assert 0 <= metrics['accuracy'] <= 1
        assert 0 <= metrics['precision'] <= 1
        assert 0 <= metrics['recall'] <= 1
        assert 0 <= metrics['f1_score'] <= 1
        
        # Check that artifact file exists
        assert os.path.exists(result['artifactPath'])
        assert result['artifactPath'].endswith('.pkl')
    
    def test_train_model_regression(self):
        """Test train_model function with regression."""
        result = train_model(
            self.regression_csv_path,
            ['feature1', 'feature2', 'feature3'],
            'target',
            'regression'
        )
        
        # Check that result has expected keys
        assert 'metrics' in result
        assert 'artifactPath' in result
        
        # Check metrics structure
        metrics = result['metrics']
        assert 'mse' in metrics
        assert 'rmse' in metrics
        assert 'r2_score' in metrics
        assert 'mae' in metrics
        
        # Check that metrics are valid
        assert metrics['mse'] >= 0
        assert metrics['rmse'] >= 0
        assert metrics['mae'] >= 0
        assert -1 <= metrics['r2_score'] <= 1
        
        # Check that artifact file exists
        assert os.path.exists(result['artifactPath'])
        assert result['artifactPath'].endswith('.pkl')
    
    def test_train_model_nonexistent_file(self):
        """Test train_model function with non-existent file."""
        with pytest.raises(FileNotFoundError):
            train_model('nonexistent_file.csv', ['feature1'], 'target', 'classification')
    
    def test_train_model_invalid_model_type(self):
        """Test train_model function with invalid model type."""
        with pytest.raises(ValueError):
            train_model(
                self.classification_csv_path,
                ['feature1', 'feature2'],
                'target',
                'invalid_type'
            )
    
    def test_train_model_nonexistent_columns(self):
        """Test train_model function with non-existent columns."""
        with pytest.raises(ValueError):
            train_model(
                self.classification_csv_path,
                ['nonexistent_column'],
                'target',
                'classification'
            )
    
    def test_prepare_data_classification(self):
        """Test prepare_data function with classification data."""
        X, y = prepare_data(
            self.classification_data,
            ['feature1', 'feature2', 'feature3'],
            'target',
            'classification'
        )
        
        # Check that X and y have correct shapes
        assert X.shape[0] == 100
        assert X.shape[1] == 3
        assert y.shape[0] == 100
        
        # Check that X is numeric
        assert np.issubdtype(X.dtype, np.number)
        
        # Check that y contains only 0s and 1s for classification
        assert set(y) <= {0, 1}
    
    def test_prepare_data_regression(self):
        """Test prepare_data function with regression data."""
        X, y = prepare_data(
            self.regression_data,
            ['feature1', 'feature2', 'feature3'],
            'target',
            'regression'
        )
        
        # Check that X and y have correct shapes
        assert X.shape[0] == 100
        assert X.shape[1] == 3
        assert y.shape[0] == 100
        
        # Check that X and y are numeric
        assert np.issubdtype(X.dtype, np.number)
        assert np.issubdtype(y.dtype, np.number)
    
    def test_create_model_classification(self):
        """Test create_model function for classification."""
        model = create_model('classification')
        assert hasattr(model, 'fit')
        assert hasattr(model, 'predict')
        assert hasattr(model, 'score')
    
    def test_create_model_regression(self):
        """Test create_model function for regression."""
        model = create_model('regression')
        assert hasattr(model, 'fit')
        assert hasattr(model, 'predict')
        assert hasattr(model, 'score')
    
    def test_calculate_metrics_classification(self):
        """Test calculate_metrics function for classification."""
        y_true = np.array([0, 1, 0, 1, 0])
        y_pred = np.array([0, 1, 1, 1, 0])
        
        metrics = calculate_metrics(y_true, y_pred, 'classification')
        
        # Check that all required metrics are present
        assert 'accuracy' in metrics
        assert 'precision' in metrics
        assert 'recall' in metrics
        assert 'f1_score' in metrics
        
        # Check that metrics are valid
        assert 0 <= metrics['accuracy'] <= 1
        assert 0 <= metrics['precision'] <= 1
        assert 0 <= metrics['recall'] <= 1
        assert 0 <= metrics['f1_score'] <= 1
    
    def test_calculate_metrics_regression(self):
        """Test calculate_metrics function for regression."""
        y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        y_pred = np.array([1.1, 1.9, 3.1, 3.9, 5.1])
        
        metrics = calculate_metrics(y_true, y_pred, 'regression')
        
        # Check that all required metrics are present
        assert 'mse' in metrics
        assert 'rmse' in metrics
        assert 'r2_score' in metrics
        assert 'mae' in metrics
        
        # Check that metrics are valid
        assert metrics['mse'] >= 0
        assert metrics['rmse'] >= 0
        assert metrics['mae'] >= 0
        assert -1 <= metrics['r2_score'] <= 1
    
    def test_save_and_load_model_artifact(self):
        """Test save_model_artifact and load_model_artifact functions."""
        # Create a mock model and scaler
        from sklearn.linear_model import LogisticRegression
        from sklearn.preprocessing import StandardScaler
        
        model = LogisticRegression()
        scaler = StandardScaler()
        features = ['feature1', 'feature2']
        target = 'target'
        model_type = 'classification'
        
        # Save artifact
        artifact_path = save_model_artifact(model, scaler, features, target, model_type)
        
        # Check that file exists
        assert os.path.exists(artifact_path)
        assert artifact_path.endswith('.pkl')
        
        # Load artifact
        loaded_package = load_model_artifact(artifact_path)
        
        # Check that loaded package has expected keys
        assert 'model' in loaded_package
        assert 'scaler' in loaded_package
        assert 'features' in loaded_package
        assert 'target' in loaded_package
        assert 'model_type' in loaded_package
        assert 'metadata' in loaded_package
        
        # Check that values are correct
        assert loaded_package['features'] == features
        assert loaded_package['target'] == target
        assert loaded_package['model_type'] == model_type
        assert 'created_at' in loaded_package['metadata']
        assert 'artifact_id' in loaded_package['metadata']
    
    def test_load_model_artifact_nonexistent_file(self):
        """Test load_model_artifact function with non-existent file."""
        with pytest.raises(FileNotFoundError):
            load_model_artifact('nonexistent_file.pkl')
    
    def test_load_dataset_csv(self):
        """Test load_dataset function with CSV file."""
        df = load_dataset(self.classification_csv_path)
        
        # Check that data is loaded correctly
        assert len(df) == 100
        assert len(df.columns) == 4
        assert 'feature1' in df.columns
        assert 'feature2' in df.columns
        assert 'feature3' in df.columns
        assert 'target' in df.columns
    
    def test_load_dataset_invalid_format(self):
        """Test load_dataset function with invalid file format."""
        # Create a text file
        txt_path = os.path.join(self.temp_dir, 'test.txt')
        with open(txt_path, 'w') as f:
            f.write("This is not a CSV file")
        
        with pytest.raises(ValueError):
            load_dataset(txt_path)
    
    def test_train_model_with_categorical_features(self):
        """Test train_model function with categorical features."""
        # Create data with categorical features
        categorical_data = pd.DataFrame({
            'numeric_feature': np.random.normal(0, 1, 50),
            'categorical_feature': np.random.choice(['A', 'B', 'C'], 50),
            'target': np.random.choice([0, 1], 50)
        })
        
        categorical_csv_path = os.path.join(self.temp_dir, 'categorical_data.csv')
        categorical_data.to_csv(categorical_csv_path, index=False)
        
        result = train_model(
            categorical_csv_path,
            ['numeric_feature', 'categorical_feature'],
            'target',
            'classification'
        )
        
        # Check that training completed successfully
        assert 'metrics' in result
        assert 'artifactPath' in result
        assert os.path.exists(result['artifactPath'])
    
    def test_train_model_with_missing_values(self):
        """Test train_model function with missing values."""
        # Create data with missing values
        missing_data = self.classification_data.copy()
        missing_data.loc[0, 'feature1'] = np.nan
        missing_data.loc[1, 'target'] = np.nan
        
        missing_csv_path = os.path.join(self.temp_dir, 'missing_data.csv')
        missing_data.to_csv(missing_csv_path, index=False)
        
        result = train_model(
            missing_csv_path,
            ['feature1', 'feature2', 'feature3'],
            'target',
            'classification'
        )
        
        # Check that training completed successfully despite missing values
        assert 'metrics' in result
        assert 'artifactPath' in result
        assert os.path.exists(result['artifactPath'])
    
    def test_artifact_file_structure(self):
        """Test that saved artifact files have proper structure."""
        result = train_model(
            self.classification_csv_path,
            ['feature1', 'feature2', 'feature3'],
            'target',
            'classification'
        )
        
        # Load the artifact
        with open(result['artifactPath'], 'rb') as f:
            artifact = pickle.load(f)
        
        # Check structure
        assert isinstance(artifact, dict)
        assert 'model' in artifact
        assert 'scaler' in artifact
        assert 'features' in artifact
        assert 'target' in artifact
        assert 'model_type' in artifact
        assert 'metadata' in artifact
        
        # Check metadata
        metadata = artifact['metadata']
        assert 'created_at' in metadata
        assert 'artifact_id' in metadata
        assert isinstance(metadata['created_at'], str)
        assert isinstance(metadata['artifact_id'], str)


if __name__ == '__main__':
    pytest.main([__file__])
