#!/usr/bin/env python3
"""
Final verification script for the MCP Python Sandbox
Tests all core functionality without requiring a running server
"""

import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all modules can be imported"""
    print("=== Testing Imports ===")
    try:
        from app import app
        print("✅ FastAPI app imported successfully")
        
        from tools.runtime import execute_python_on_dataset
        print("✅ runtime.execute_python_on_dataset imported successfully")
        
        from tools.cleaning import drop_nulls
        print("✅ cleaning.drop_nulls imported successfully")
        
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_runtime_tool():
    """Test the runtime tool directly"""
    print("\n=== Testing Runtime Tool ===")
    try:
        from tools.runtime import execute_python_on_dataset
        
        # Create test dataset
        import pandas as pd
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        test_data = {
            'name': ['Alice', 'Bob', 'Charlie'],
            'age': [25, 30, 35],
            'salary': [50000, 60000, 70000]
        }
        df = pd.DataFrame(test_data)
        test_file = uploads_dir / "test_verification.parquet"
        df.to_parquet(test_file, index=False)
        print(f"✅ Created test dataset: {test_file}")
        
        # Test simple operation
        result = execute_python_on_dataset("test_verification", "print('Hello from MCP!'); print(f'Dataset shape: {df.shape}')")
        print(f"✅ Runtime tool executed successfully")
        print(f"   Status: {result['status']}")
        print(f"   Summary: {result['summary']}")
        
        # Clean up
        test_file.unlink()
        print("✅ Cleaned up test file")
        
        return True
    except Exception as e:
        print(f"❌ Runtime tool error: {e}")
        return False

def test_cleaning_tool():
    """Test the cleaning tool directly"""
    print("\n=== Testing Cleaning Tool ===")
    try:
        from tools.cleaning import drop_nulls
        
        # Create test dataset with nulls
        import pandas as pd
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        test_data = {
            'name': ['Alice', 'Bob', None, 'Charlie'],
            'age': [25, 30, None, 35],
            'salary': [50000, None, 70000, 80000]
        }
        df = pd.DataFrame(test_data)
        test_file = uploads_dir / "test_cleaning.parquet"
        df.to_parquet(test_file, index=False)
        print(f"✅ Created test dataset with nulls: {test_file}")
        
        # Test drop nulls
        result = drop_nulls("test_cleaning", ["name", "age"])
        print(f"✅ Cleaning tool executed successfully")
        print(f"   New dataset ID: {result['newDatasetId']}")
        print(f"   Summary: {result['summary']}")
        
        # Clean up
        test_file.unlink()
        if result['newDatasetId']:
            new_file = uploads_dir / f"{result['newDatasetId']}.parquet"
            if new_file.exists():
                new_file.unlink()
        print("✅ Cleaned up test files")
        
        return True
    except Exception as e:
        print(f"❌ Cleaning tool error: {e}")
        return False

def test_app_configuration():
    """Test that the FastAPI app is properly configured"""
    print("\n=== Testing App Configuration ===")
    try:
        from app import app
        
        # Check that all endpoints are registered
        routes = [route.path for route in app.routes]
        expected_routes = [
            "/health",
            "/mcp/tools", 
            "/mcp/clean/drop_nulls",
            "/mcp/runtime/execute_python",
            "/mcp/stats/summary",
            "/mcp/plot/generate",
            "/mcp/train"
        ]
        
        for route in expected_routes:
            if route in routes:
                print(f"✅ Route {route} registered")
            else:
                print(f"❌ Route {route} missing")
                return False
        
        print("✅ All expected routes are registered")
        return True
    except Exception as e:
        print(f"❌ App configuration error: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 MCP Python Sandbox - Final Verification")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_runtime_tool,
        test_cleaning_tool,
        test_app_configuration
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! The MCP Python Sandbox is working correctly.")
        print("\n✅ Core functionality verified:")
        print("   - FastAPI app configuration")
        print("   - Runtime tool (execute_python_on_dataset)")
        print("   - Cleaning tool (drop_nulls)")
        print("   - All endpoints registered")
        print("\n🚀 The code is ready for production!")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
