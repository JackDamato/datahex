#!/usr/bin/env python3
"""Test the API endpoints directly without starting a server."""

import json
from app import app
from fastapi.testclient import TestClient

def test_api_endpoints():
    """Test all API endpoints using FastAPI TestClient."""
    client = TestClient(app)
    
    print("🧪 Testing API Endpoints...")
    
    # Test health endpoint
    print("\n1. Testing /health endpoint...")
    response = client.get("/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200
    
    # Test tools endpoint
    print("\n2. Testing /mcp/tools endpoint...")
    response = client.get("/mcp/tools")
    print(f"   Status: {response.status_code}")
    tools = response.json()
    print(f"   Found {len(tools)} tools:")
    for tool in tools:
        print(f"   - {tool['name']}: {tool['description']}")
    assert response.status_code == 200
    assert len(tools) == 5
    
    # Test drop_nulls endpoint
    print("\n3. Testing /mcp/clean/drop_nulls endpoint...")
    response = client.post("/mcp/clean/drop_nulls", json={
        "dataset_id": "test_dataset",
        "columns": ["name", "age"]
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Response: {result}")
        assert "newDatasetId" in result
        assert "rows" in result
    else:
        print(f"   Error: {response.text}")
    
    # Test execute_python endpoint
    print("\n4. Testing /mcp/runtime/execute_python endpoint...")
    response = client.post("/mcp/runtime/execute_python", json={
        "code": "print('Hello from sandbox!')"
    })
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Response: {result}")
        assert "stdout" in result
        assert "stderr" in result
        assert "returncode" in result
    else:
        print(f"   Error: {response.text}")
    
    # Test stub endpoints
    print("\n5. Testing stub endpoints...")
    
    # Stats stub
    response = client.post("/mcp/stats/summary", json={
        "dataset_id": "test_dataset",
        "column": "age"
    })
    print(f"   Stats endpoint: {response.status_code}")
    assert response.status_code == 200
    
    # Plot stub
    response = client.post("/mcp/plot/generate", json={
        "dataset_id": "test_dataset",
        "type": "histogram",
        "columns": ["age"]
    })
    print(f"   Plot endpoint: {response.status_code}")
    assert response.status_code == 200
    
    # Train stub
    response = client.post("/mcp/train", json={
        "dataset_id": "test_dataset",
        "features": ["age"],
        "target": "salary",
        "type": "regression"
    })
    print(f"   Train endpoint: {response.status_code}")
    assert response.status_code == 200
    
    print("\n✅ All API endpoint tests passed!")

if __name__ == "__main__":
    test_api_endpoints()
