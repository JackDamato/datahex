import requests

# Test the API endpoint
response = requests.post('http://localhost:8080/mcp/runtime/execute_python', 
                        json={'datasetId': 'test', 'code': 'print("Hello from API!")'})

print('Status:', response.status_code)
print('Response:', response.json())
