#!/usr/bin/env python3
"""
Test runner for Commit 06
Runs all tests to verify the implementation is complete
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def run_command(command, cwd=None, timeout=60):
    """Run a command and return success status"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            timeout=timeout,
            capture_output=True, 
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", f"Command timed out after {timeout} seconds"
    except Exception as e:
        return False, "", str(e)

def check_service(url, name, timeout=5):
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except:
        return False

def run_sandbox_tests():
    """Run sandbox pytest tests"""
    print("🧪 Running sandbox pytest tests...")
    
    success, stdout, stderr = run_command(
        "python -m pytest sandbox/tests/test_commit06_endpoints.py -v",
        cwd=".",
        timeout=120
    )
    
    if success:
        print("✅ Sandbox tests passed")
        return True
    else:
        print("❌ Sandbox tests failed")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return False

def run_backend_tests():
    """Run backend Jest tests"""
    print("🧪 Running backend Jest tests...")
    
    # Check if node_modules exists
    if not Path("backend/node_modules").exists():
        print("📦 Installing backend dependencies...")
        success, stdout, stderr = run_command("npm install", cwd="backend")
        if not success:
            print("❌ Failed to install backend dependencies")
            print("STDERR:", stderr)
            return False
    
    success, stdout, stderr = run_command(
        "npm test",
        cwd="backend",
        timeout=60
    )
    
    if success:
        print("✅ Backend tests passed")
        return True
    else:
        print("❌ Backend tests failed")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return False

def run_integration_tests():
    """Run integration tests"""
    print("🧪 Running integration tests...")
    
    success, stdout, stderr = run_command(
        "node backend/tests/test_mcp_integration.js",
        cwd=".",
        timeout=120
    )
    
    if success:
        print("✅ Integration tests passed")
        return True
    else:
        print("❌ Integration tests failed")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return False

def run_e2e_tests():
    """Run end-to-end tests"""
    print("🧪 Running end-to-end tests...")
    
    success, stdout, stderr = run_command(
        "python test_commit06_e2e.py",
        cwd=".",
        timeout=300
    )
    
    if success:
        print("✅ E2E tests passed")
        return True
    else:
        print("❌ E2E tests failed")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return False

def check_services():
    """Check if required services are running"""
    print("🔍 Checking services...")
    
    services = [
        ("Backend", "http://localhost:3001/health"),
        ("Sandbox", "http://localhost:8080/health")
    ]
    
    all_running = True
    for name, url in services:
        if check_service(url, name):
            print(f"✅ {name} is running")
        else:
            print(f"❌ {name} is not running at {url}")
            all_running = False
    
    return all_running

def main():
    """Main test runner"""
    print("🚀 Commit 06 Test Runner")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("sandbox").exists() or not Path("backend").exists():
        print("❌ Please run this script from the project root directory")
        return 1
    
    # Check services first
    if not check_services():
        print("\n❌ Required services are not running. Please start them first:")
        print("   Backend: npm run dev (in backend directory)")
        print("   Sandbox: python app.py (in sandbox directory)")
        return 1
    
    print("\n🧪 Running all tests...")
    print("=" * 50)
    
    test_results = []
    
    # Run sandbox tests
    test_results.append(("Sandbox Tests", run_sandbox_tests()))
    
    # Run backend tests
    test_results.append(("Backend Tests", run_backend_tests()))
    
    # Run integration tests
    test_results.append(("Integration Tests", run_integration_tests()))
    
    # Run E2E tests
    test_results.append(("E2E Tests", run_e2e_tests()))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, success in test_results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name:<20} {status}")
        if success:
            passed += 1
    
    print("=" * 50)
    print(f"Total: {passed}/{total} test suites passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("Commit 06 implementation is complete and working correctly.")
        return 0
    else:
        print(f"\n❌ {total - passed} test suite(s) failed.")
        print("Please check the output above for details.")
        return 1

if __name__ == "__main__":
    exit(main())
