#!/usr/bin/env python3
"""
End-to-end test script for Commit 06
Tests the complete flow: upload dataset → clean → execute Python → verify results
"""

import requests
import pandas as pd
import json
import time
import uuid
from pathlib import Path
import os

# Configuration
BACKEND_URL = "http://localhost:3001"
SANDBOX_URL = "http://localhost:8080"
TEST_USER = "testuser"
TEST_PASS = "testpass"

class Commit06E2ETest:
    def __init__(self):
        self.auth_token = None
        self.project_id = None
        self.dataset_id = None
        self.uploads_dir = Path("sandbox/uploads")
        self.uploads_dir.mkdir(exist_ok=True)
        
    def log(self, message):
        """Log with timestamp"""
        print(f"[{time.strftime('%H:%M:%S')}] {message}")
    
    def create_test_dataset(self):
        """Create a test parquet dataset"""
        self.log("Creating test dataset...")
        
        # Create test data with nulls
        data = {
            'name': ['Alice', 'Bob', None, 'Charlie', 'David', 'Eve'],
            'age': [25, 30, None, 35, 40, 28],
            'salary': [50000, None, 70000, 80000, 90000, 55000],
            'department': ['IT', 'HR', 'IT', 'Finance', 'IT', 'Marketing']
        }
        
        df = pd.DataFrame(data)
        self.dataset_id = str(uuid.uuid4())
        test_file = self.uploads_dir / f"{self.dataset_id}.parquet"
        df.to_parquet(test_file, index=False)
        
        self.log(f"Created test dataset: {self.dataset_id}")
        return self.dataset_id
    
    def authenticate(self):
        """Authenticate with backend"""
        self.log("Authenticating with backend...")
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json={
            "username": TEST_USER,
            "password": TEST_PASS
        })
        
        if response.status_code != 200:
            raise Exception(f"Authentication failed: {response.text}")
        
        self.auth_token = response.json()["token"]
        self.log("Authentication successful")
    
    def create_project(self):
        """Create a test project"""
        self.log("Creating test project...")
        
        response = requests.post(f"{BACKEND_URL}/projects", 
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={"name": "E2E Test Project"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Project creation failed: {response.text}")
        
        self.project_id = response.json()["projectId"]
        self.log(f"Created project: {self.project_id}")
    
    def create_dataset_record(self):
        """Create dataset record in backend"""
        self.log("Creating dataset record in backend...")
        
        response = requests.post(f"{BACKEND_URL}/projects/{self.project_id}/datasets",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={
                "name": "E2E Test Dataset",
                "description": "Test dataset for E2E testing"
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Dataset record creation failed: {response.text}")
        
        self.log("Dataset record created")
    
    def test_sandbox_health(self):
        """Test sandbox health"""
        self.log("Testing sandbox health...")
        
        response = requests.get(f"{SANDBOX_URL}/health")
        if response.status_code != 200:
            raise Exception(f"Sandbox health check failed: {response.text}")
        
        self.log("Sandbox is healthy")
    
    def test_drop_nulls(self):
        """Test drop_nulls operation"""
        self.log("Testing drop_nulls operation...")
        
        # Test via backend
        response = requests.post(f"{BACKEND_URL}/mcp/clean/drop_nulls",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={
                "dataset_id": self.dataset_id,
                "columns": ["name", "age"]
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Drop nulls failed: {response.text}")
        
        result = response.json()
        self.log(f"Drop nulls result: {result}")
        
        # Verify new parquet file exists
        new_file = self.uploads_dir / f"{result['newDatasetId']}.parquet"
        if not new_file.exists():
            raise Exception(f"New parquet file not created: {new_file}")
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        self.log(f"Cleaned dataset shape: {new_df.shape}")
        
        # Should have no nulls in name and age columns
        nulls_in_specified = new_df[["name", "age"]].isnull().sum().sum()
        if nulls_in_specified > 0:
            raise Exception(f"Still has nulls in specified columns: {nulls_in_specified}")
        
        self.log("Drop nulls test passed")
        return result['newDatasetId']
    
    def test_execute_python(self, dataset_id):
        """Test execute_python operation"""
        self.log("Testing execute_python operation...")
        
        # Test via backend
        response = requests.post(f"{BACKEND_URL}/mcp/execute_python_on_dataset",
            headers={"Authorization": f"Bearer {self.auth_token}"},
            json={
                "datasetId": dataset_id,
                "code": """
# Add a new column and filter data
df['age_group'] = df['age'].apply(lambda x: 'Young' if x < 30 else 'Old' if x < 40 else 'Senior')
df = df[df['age'] > 25]  # Filter out young people
print(f"Processed dataset. New shape: {df.shape}")
print(f"Age groups: {df['age_group'].value_counts().to_dict()}")
"""
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Execute Python failed: {response.text}")
        
        result = response.json()
        self.log(f"Execute Python result: {result}")
        
        if result['status'] != 'success':
            raise Exception(f"Python execution failed: {result['stderr']}")
        
        if not result['newDatasetId']:
            raise Exception("No new dataset created")
        
        # Verify new parquet file exists
        new_file = self.uploads_dir / f"{result['newDatasetId']}.parquet"
        if not new_file.exists():
            raise Exception(f"New parquet file not created: {new_file}")
        
        # Verify content
        new_df = pd.read_parquet(new_file)
        self.log(f"Processed dataset shape: {new_df.shape}")
        
        # Should have age_group column
        if 'age_group' not in new_df.columns:
            raise Exception("age_group column not added")
        
        # All ages should be > 25
        if (new_df['age'] <= 25).any():
            raise Exception("Filtering did not work correctly")
        
        self.log("Execute Python test passed")
        return result['newDatasetId']
    
    def test_dataset_versions(self, original_dataset_id):
        """Test dataset version history"""
        self.log("Testing dataset version history...")
        
        response = requests.get(f"{BACKEND_URL}/mcp/dataset/{original_dataset_id}/versions",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Get versions failed: {response.text}")
        
        versions = response.json()["versions"]
        self.log(f"Found {len(versions)} versions")
        
        # Should have at least 2 versions (drop_nulls and execute_python)
        if len(versions) < 2:
            raise Exception(f"Expected at least 2 versions, got {len(versions)}")
        
        # Check operations
        operations = [v['operation'] for v in versions]
        if 'drop_nulls' not in operations:
            raise Exception("drop_nulls operation not found in versions")
        if 'execute_python' not in operations:
            raise Exception("execute_python operation not found in versions")
        
        self.log("Dataset versions test passed")
    
    def cleanup(self):
        """Clean up test files"""
        self.log("Cleaning up test files...")
        
        # Remove test parquet files
        for file in self.uploads_dir.glob("*.parquet"):
            if str(uuid.UUID(file.stem)):  # Only delete UUID files
                file.unlink()
        
        self.log("Cleanup complete")
    
    def run_full_test(self):
        """Run the complete end-to-end test"""
        try:
            self.log("Starting Commit 06 E2E Test")
            self.log("=" * 50)
            
            # Setup
            self.create_test_dataset()
            self.authenticate()
            self.create_project()
            self.create_dataset_record()
            
            # Test sandbox
            self.test_sandbox_health()
            
            # Test operations
            cleaned_dataset_id = self.test_drop_nulls()
            processed_dataset_id = self.test_execute_python(cleaned_dataset_id)
            
            # Test version tracking
            self.test_dataset_versions(self.dataset_id)
            
            self.log("=" * 50)
            self.log("🎉 ALL TESTS PASSED!")
            self.log("Commit 06 implementation is working correctly")
            
            return True
            
        except Exception as e:
            self.log(f"❌ TEST FAILED: {str(e)}")
            return False
        
        finally:
            self.cleanup()

def main():
    """Main test runner"""
    print("Commit 06 End-to-End Test")
    print("=" * 50)
    print("This test will:")
    print("1. Create a test dataset with nulls")
    print("2. Authenticate with backend")
    print("3. Test drop_nulls operation")
    print("4. Test execute_python operation")
    print("5. Verify dataset version tracking")
    print("6. Clean up test files")
    print("=" * 50)
    
    # Check if services are running
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print("✅ Backend is running")
    except:
        print("❌ Backend is not running. Please start it first.")
        return False
    
    try:
        response = requests.get(f"{SANDBOX_URL}/health", timeout=5)
        print("✅ Sandbox is running")
    except:
        print("❌ Sandbox is not running. Please start it first.")
        return False
    
    # Run the test
    test = Commit06E2ETest()
    success = test.run_full_test()
    
    if success:
        print("\n🎉 Commit 06 is complete and working!")
        return 0
    else:
        print("\n❌ Commit 06 has issues that need to be fixed.")
        return 1

if __name__ == "__main__":
    exit(main())
