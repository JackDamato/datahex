import requests

# Test with existing dataset
print("=== Testing with existing dataset ===")
response = requests.post('http://localhost:8080/mcp/runtime/execute_python', 
                        json={
                            'datasetId': 'test_dataset', 
                            'code': '''
print("Dataset shape:", df.shape)
print("Columns:", df.columns.tolist())
print("First few rows:")
print(df.head())
'''
                        })

print('Status:', response.status_code)
print('Response:', response.json())
