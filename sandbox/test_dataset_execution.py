"""
Test script for the new runtime.execute_python dataset functionality.
"""

import os
import pandas as pd
from pathlib import Path
from tools.runtime import execute_python_on_dataset

def create_test_dataset():
    """Create a test dataset for testing."""
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    
    # Create test data
    data = {
        'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
        'age': [25, 30, 35, 28],
        'salary': [50000, 60000, 70000, 55000],
        'department': ['IT', 'HR', 'IT', 'Finance']
    }
    df = pd.DataFrame(data)
    
    # Save test dataset
    test_dataset_id = "test_runtime_dataset"
    file_path = uploads_dir / f"{test_dataset_id}.parquet"
    df.to_parquet(file_path, index=False)
    
    print(f"Created test dataset: {test_dataset_id}")
    print(f"Shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    return test_dataset_id

def test_simple_operation():
    """Test simple DataFrame operation."""
    print("\n=== Testing Simple Operation ===")
    
    dataset_id = create_test_dataset()
    
    code = """
# Simple operation: add a new column
df['age_group'] = df['age'].apply(lambda x: 'Young' if x < 30 else 'Old')
print(f"Added age_group column. New shape: {df.shape}")
"""
    
    result = execute_python_on_dataset(dataset_id, code)
    
    print(f"Status: {result['status']}")
    print(f"New Dataset ID: {result['newDatasetId']}")
    print(f"Summary: {result['summary']}")
    print(f"Stdout: {result['stdout']}")
    if result['stderr']:
        print(f"Stderr: {result['stderr']}")
    
    return result

def test_data_filtering():
    """Test data filtering operation."""
    print("\n=== Testing Data Filtering ===")
    
    dataset_id = create_test_dataset()
    
    code = """
# Filter data: keep only IT department
df = df[df['department'] == 'IT']
print(f"Filtered to IT department. New shape: {df.shape}")
print(f"Remaining names: {df['name'].tolist()}")
"""
    
    result = execute_python_on_dataset(dataset_id, code)
    
    print(f"Status: {result['status']}")
    print(f"New Dataset ID: {result['newDatasetId']}")
    print(f"Summary: {result['summary']}")
    print(f"Stdout: {result['stdout']}")
    if result['stderr']:
        print(f"Stderr: {result['stderr']}")
    
    return result

def test_forbidden_import():
    """Test that forbidden imports are blocked."""
    print("\n=== Testing Forbidden Import ===")
    
    dataset_id = create_test_dataset()
    
    code = """
import os  # This should be blocked
df['test'] = 'blocked'
"""
    
    result = execute_python_on_dataset(dataset_id, code)
    
    print(f"Status: {result['status']}")
    print(f"New Dataset ID: {result['newDatasetId']}")
    print(f"Summary: {result['summary']}")
    print(f"Stdout: {result['stdout']}")
    if result['stderr']:
        print(f"Stderr: {result['stderr']}")
    
    return result

def test_nonexistent_dataset():
    """Test with non-existent dataset."""
    print("\n=== Testing Non-existent Dataset ===")
    
    code = """
df['test'] = 'should fail'
"""
    
    result = execute_python_on_dataset("nonexistent_dataset", code)
    
    print(f"Status: {result['status']}")
    print(f"New Dataset ID: {result['newDatasetId']}")
    print(f"Summary: {result['summary']}")
    print(f"Stdout: {result['stdout']}")
    if result['stderr']:
        print(f"Stderr: {result['stderr']}")
    
    return result

def test_read_only_operation():
    """Test read-only operation (no DataFrame modification)."""
    print("\n=== Testing Read-only Operation ===")
    
    dataset_id = create_test_dataset()
    
    code = """
# Read-only operation: just print info
print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"Average age: {df['age'].mean()}")
print(f"Department counts: {df['department'].value_counts().to_dict()}")
"""
    
    result = execute_python_on_dataset(dataset_id, code)
    
    print(f"Status: {result['status']}")
    print(f"New Dataset ID: {result['newDatasetId']}")
    print(f"Summary: {result['summary']}")
    print(f"Stdout: {result['stdout']}")
    if result['stderr']:
        print(f"Stderr: {result['stderr']}")
    
    return result

def cleanup_test_files():
    """Clean up test files."""
    uploads_dir = Path("uploads")
    for file in uploads_dir.glob("test_runtime_dataset*.parquet"):
        file.unlink()
        print(f"Cleaned up: {file}")

if __name__ == "__main__":
    try:
        test_simple_operation()
        test_data_filtering()
        test_forbidden_import()
        test_nonexistent_dataset()
        test_read_only_operation()
        print("\n=== All tests completed ===")
    finally:
        cleanup_test_files()
