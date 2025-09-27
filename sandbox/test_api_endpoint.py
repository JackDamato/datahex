"""
Test the FastAPI endpoint for runtime.execute_python
"""

import requests
import json
import time

# Wait for server to start
time.sleep(3)

# Test data
test_dataset_id = "test_runtime_dataset"

# Create test dataset first
import pandas as pd
from pathlib import Path

uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

data = {
    'name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'age': [25, 30, 35, 28],
    'salary': [50000, 60000, 70000, 55000],
    'department': ['IT', 'HR', 'IT', 'Finance']
}
df = pd.DataFrame(data)
df.to_parquet(uploads_dir / f"{test_dataset_id}.parquet", index=False)

print(f"Created test dataset: {test_dataset_id}")

# Test the API endpoint
url = "http://localhost:8080/mcp/runtime/execute_python"

# Test 1: Simple operation
print("\n=== Test 1: Simple Operation ===")
payload = {
    "datasetId": test_dataset_id,
    "code": """
# Add a new column
df['age_group'] = df['age'].apply(lambda x: 'Young' if x < 30 else 'Old')
print(f"Added age_group column. New shape: {df.shape}")
"""
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Forbidden import
print("\n=== Test 2: Forbidden Import ===")
payload = {
    "datasetId": test_dataset_id,
    "code": """
import os  # This should be blocked
df['test'] = 'blocked'
"""
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: Non-existent dataset
print("\n=== Test 3: Non-existent Dataset ===")
payload = {
    "datasetId": "nonexistent_dataset",
    "code": "df['test'] = 'should fail'"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Check tools list
print("\n=== Test 4: Check Tools List ===")
try:
    response = requests.get("http://localhost:8080/mcp/tools")
    print(f"Status Code: {response.status_code}")
    tools = response.json()
    for tool in tools:
        if tool['name'] == 'runtime.execute_python':
            print(f"Found runtime.execute_python tool:")
            print(json.dumps(tool, indent=2))
            break
    else:
        print("runtime.execute_python tool not found in tools list")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Tests completed ===")
