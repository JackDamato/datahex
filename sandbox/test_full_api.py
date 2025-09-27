import requests
import pandas as pd
from pathlib import Path

# Create test dataset
uploads_dir = Path("uploads")
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
}
df = pd.DataFrame(data)
df.to_parquet(uploads_dir / "test_dataset.parquet", index=False)

print("Created test dataset: test_dataset.parquet")

# Test 1: Simple operation
print("\n=== Test 1: Simple Operation ===")
response = requests.post('http://localhost:8080/mcp/runtime/execute_python', 
                        json={
                            'datasetId': 'test_dataset', 
                            'code': '''
# Add a new column
df['age_group'] = df['age'].apply(lambda x: 'Young' if x < 30 else 'Old')
print(f"Added age_group column. New shape: {df.shape}")
'''
                        })

print('Status:', response.status_code)
print('Response:', response.json())

# Test 2: Check tools list
print("\n=== Test 2: Tools List ===")
response = requests.get('http://localhost:8080/mcp/tools')
print('Status:', response.status_code)
tools = response.json()
for tool in tools:
    if tool['name'] == 'runtime.execute_python':
        print('Found runtime.execute_python tool:', tool)
        break

# Test 3: Health check
print("\n=== Test 3: Health Check ===")
response = requests.get('http://localhost:8080/health')
print('Status:', response.status_code)
print('Response:', response.json())
