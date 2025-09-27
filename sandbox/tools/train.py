"""
Machine Learning Training Tools

This module provides machine learning training functions for the MCP tool server.
Implements model training using scikit-learn with support for classification and regression.
"""

import pandas as pd
import numpy as np
import pickle
import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import warnings

# Suppress sklearn warnings
warnings.filterwarnings('ignore')


def train_model(dataset_path: str, features: List[str], target: str, model_type: str) -> Dict[str, Any]:
    """
    Train a machine learning model on the specified dataset.
    
    Args:
        dataset_path (str): Path to the dataset file
        features (List[str]): List of feature column names
        target (str): Name of the target column
        model_type (str): Type of model ('classification' or 'regression')
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - metrics (Dict[str, float]): Model performance metrics
            - artifactPath (str): Path to the saved model file
    
    Raises:
        FileNotFoundError: If the dataset file doesn't exist
        ValueError: If model type is not supported or columns are invalid
        Exception: For other processing errors
    """
    try:
        # Validate input file exists
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
        
        # Load dataset
        df = load_dataset(dataset_path)
        
        # Validate columns exist
        all_columns = features + [target]
        missing_columns = [col for col in all_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Columns not found in dataset: {missing_columns}")
        
        # Validate model type
        if model_type not in ['classification', 'regression']:
            raise ValueError(f"Invalid model type: {model_type}. Must be 'classification' or 'regression'")
        
        # Prepare data
        X, y = prepare_data(df, features, target, model_type)
        
        # Split data
        # Check if we can use stratified split for classification
        stratify_param = None
        if model_type == 'classification':
            # Check if all classes have at least 2 samples
            unique_classes, class_counts = np.unique(y, return_counts=True)
            if np.min(class_counts) >= 2:
                stratify_param = y
            else:
                print(f"Warning: Some classes have fewer than 2 samples. Using random split instead of stratified split.")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=stratify_param
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        model = create_model(model_type)
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test_scaled)
        
        # Calculate metrics
        metrics = calculate_metrics(y_test, y_pred, model_type)
        
        # Save model and scaler
        artifact_path = save_model_artifact(model, scaler, features, target, model_type)
        
        return {
            "metrics": metrics,
            "artifactPath": artifact_path
        }
        
    except FileNotFoundError:
        raise
    except ValueError:
        raise
    except Exception as e:
        raise Exception(f"Error training model: {str(e)}")


def prepare_data(df: pd.DataFrame, features: List[str], target: str, model_type: str) -> Tuple[np.ndarray, np.ndarray]:
    """
    Prepare data for model training.
    
    Args:
        df (pd.DataFrame): Input dataset
        features (List[str]): Feature columns
        target (str): Target column
        model_type (str): Type of model
    
    Returns:
        Tuple[np.ndarray, np.ndarray]: Features (X) and target (y) arrays
    """
    try:
        # Select features and target
        X = df[features].copy()
        y = df[target].copy()
        
        # Handle missing values
        # For numeric columns, fill with mean
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            X[numeric_cols] = X[numeric_cols].fillna(X[numeric_cols].mean())
        
        # For categorical columns, fill with mode
        categorical_cols = X.select_dtypes(exclude=[np.number]).columns
        if len(categorical_cols) > 0:
            for col in categorical_cols:
                if not X[col].isna().all():
                    X[col] = X[col].fillna(X[col].mode().iloc[0] if not X[col].mode().empty else 'Unknown')
        
        # Handle target variable missing values
        if y.dtype == 'object' or y.dtype.name == 'category':
            y = y.fillna(y.mode().iloc[0] if not y.mode().empty else 0)
        else:
            # For numeric targets in classification, use mode instead of mean to keep discrete values
            if model_type == 'classification':
                y = y.fillna(y.mode().iloc[0] if not y.mode().empty else 0)
            else:
                y = y.fillna(y.mean())
        
        # Encode categorical variables in features
        X_encoded = encode_categorical_features(X)
        
        # Encode target variable for classification
        if model_type == 'classification':
            if y.dtype == 'object' or y.dtype.name == 'category':
                le = LabelEncoder()
                y_encoded = le.fit_transform(y)
            else:
                y_encoded = y.values
        else:
            y_encoded = y.values
        
        return X_encoded, y_encoded
        
    except Exception as e:
        raise Exception(f"Error preparing data: {str(e)}")


def encode_categorical_features(X: pd.DataFrame) -> np.ndarray:
    """
    Encode categorical features using one-hot encoding.
    
    Args:
        X (pd.DataFrame): Feature dataframe
    
    Returns:
        np.ndarray: Encoded features array
    """
    try:
        # Separate numeric and categorical columns
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        categorical_cols = X.select_dtypes(exclude=[np.number]).columns
        
        # Keep numeric columns as is
        X_encoded = X[numeric_cols].copy()
        
        # One-hot encode categorical columns
        for col in categorical_cols:
            dummies = pd.get_dummies(X[col], prefix=col, drop_first=True)
            X_encoded = pd.concat([X_encoded, dummies], axis=1)
        
        return X_encoded.values
        
    except Exception as e:
        raise Exception(f"Error encoding categorical features: {str(e)}")


def create_model(model_type: str):
    """
    Create a model instance based on the specified type.
    
    Args:
        model_type (str): Type of model ('classification' or 'regression')
    
    Returns:
        Model instance
    """
    if model_type == 'classification':
        return LogisticRegression(random_state=42, max_iter=1000)
    else:  # regression
        return LinearRegression()


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, model_type: str) -> Dict[str, float]:
    """
    Calculate model performance metrics.
    
    Args:
        y_true (np.ndarray): True values
        y_pred (np.ndarray): Predicted values
        model_type (str): Type of model
    
    Returns:
        Dict[str, float]: Performance metrics
    """
    try:
        if model_type == 'classification':
            return {
                "accuracy": float(accuracy_score(y_true, y_pred)),
                "precision": float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
                "recall": float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
                "f1_score": float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
            }
        else:  # regression
            return {
                "mse": float(mean_squared_error(y_true, y_pred)),
                "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
                "r2_score": float(r2_score(y_true, y_pred)),
                "mae": float(np.mean(np.abs(y_true - y_pred)))
            }
    except Exception as e:
        raise Exception(f"Error calculating metrics: {str(e)}")


def save_model_artifact(model, scaler, features: List[str], target: str, model_type: str) -> str:
    """
    Save the trained model and scaler as a pickle file.
    
    Args:
        model: Trained model
        scaler: Fitted scaler
        features (List[str]): Feature names
        target (str): Target name
        model_type (str): Model type
    
    Returns:
        str: Path to the saved artifact
    """
    try:
        # Create artifacts directory
        artifacts_dir = Path("artifacts")
        artifacts_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        artifact_id = str(uuid.uuid4())
        artifact_filename = f"model_{artifact_id}.pkl"
        artifact_path = artifacts_dir / artifact_filename
        
        # Create model package
        model_package = {
            'model': model,
            'scaler': scaler,
            'features': features,
            'target': target,
            'model_type': model_type,
            'metadata': {
                'created_at': pd.Timestamp.now().isoformat(),
                'artifact_id': artifact_id
            }
        }
        
        # Save model package
        with open(artifact_path, 'wb') as f:
            pickle.dump(model_package, f)
        
        return str(artifact_path)
        
    except Exception as e:
        raise Exception(f"Error saving model artifact: {str(e)}")


def load_model_artifact(artifact_path: str) -> Dict[str, Any]:
    """
    Load a saved model artifact.
    
    Args:
        artifact_path (str): Path to the artifact file
    
    Returns:
        Dict[str, Any]: Loaded model package
    """
    try:
        if not os.path.exists(artifact_path):
            raise FileNotFoundError(f"Artifact file not found: {artifact_path}")
        
        with open(artifact_path, 'rb') as f:
            model_package = pickle.load(f)
        
        return model_package
        
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise Exception(f"Error loading model artifact: {str(e)}")


def predict_with_model(artifact_path: str, data: pd.DataFrame) -> np.ndarray:
    """
    Make predictions using a saved model.
    
    Args:
        artifact_path (str): Path to the model artifact
        data (pd.DataFrame): Input data for prediction
    
    Returns:
        np.ndarray: Predictions
    """
    try:
        # Load model package
        model_package = load_model_artifact(artifact_path)
        
        model = model_package['model']
        scaler = model_package['scaler']
        features = model_package['features']
        
        # Prepare data
        X = data[features].copy()
        X = X.fillna(X.mean() if X.select_dtypes(include=[np.number]).shape[1] > 0 else X.mode().iloc[0])
        X_encoded = encode_categorical_features(X)
        
        # Scale features
        X_scaled = scaler.transform(X_encoded)
        
        # Make predictions
        predictions = model.predict(X_scaled)
        
        return predictions
        
    except Exception as e:
        raise Exception(f"Error making predictions: {str(e)}")


def load_dataset(dataset_path: str) -> pd.DataFrame:
    """
    Load a dataset from various file formats.
    
    Args:
        dataset_path (str): Path to the dataset file
    
    Returns:
        pd.DataFrame: Loaded dataset
    
    Raises:
        ValueError: If file format is not supported
    """
    file_extension = Path(dataset_path).suffix.lower()
    
    if file_extension == '.csv':
        return pd.read_csv(dataset_path)
    elif file_extension == '.parquet':
        return pd.read_parquet(dataset_path)
    elif file_extension in ['.xlsx', '.xls']:
        return pd.read_excel(dataset_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")


def get_model_info(artifact_path: str) -> Dict[str, Any]:
    """
    Get information about a saved model.
    
    Args:
        artifact_path (str): Path to the model artifact
    
    Returns:
        Dict[str, Any]: Model information
    """
    try:
        model_package = load_model_artifact(artifact_path)
        
        return {
            "model_type": model_package['model_type'],
            "features": model_package['features'],
            "target": model_package['target'],
            "metadata": model_package['metadata'],
            "model_class": type(model_package['model']).__name__
        }
        
    except Exception as e:
        raise Exception(f"Error getting model info: {str(e)}")
