#!/usr/bin/env python3
"""
Direct test of all data science operations without FastAPI server
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tools.cleaning import drop_nulls
from tools.stats import compute_summary_stats
from tools.plotgen import generate_plot
from tools.train import train_model

def test_all_operations():
    """Test all data science operations directly"""
    print("🧪 Testing Data Science Operations Directly...")
    
    dataset_path = "test-data/test_small.csv"
    
    # Test 1: Data Cleaning
    print("\n1. Testing Data Cleaning...")
    try:
        result = drop_nulls(dataset_path)
        print(f"   ✅ Data cleaning: {result['rows']} rows, {result['columns']} columns")
        print(f"   📁 Output: {result['newDatasetPath']}")
    except Exception as e:
        print(f"   ❌ Data cleaning failed: {e}")
    
    # Test 2: Statistical Analysis
    print("\n2. Testing Statistical Analysis...")
    try:
        result = compute_summary_stats(dataset_path, "age")
        print(f"   ✅ Stats for 'age': mean={result['mean']:.2f}, std={result['std']:.2f}")
        print(f"   📊 Histogram buckets: {len(result['histogram'])}")
    except Exception as e:
        print(f"   ❌ Statistical analysis failed: {e}")
    
    # Test 3: Plot Generation
    print("\n3. Testing Plot Generation...")
    try:
        result = generate_plot(dataset_path, "histogram", ["age"])
        print(f"   ✅ Plot generated: {len(result['data'])} traces")
        print(f"   📈 Plot type: {result['data'][0]['type']}")
    except Exception as e:
        print(f"   ❌ Plot generation failed: {e}")
    
    # Test 4: Machine Learning
    print("\n4. Testing Machine Learning...")
    try:
        result = train_model(dataset_path, ["age", "salary"], "performance_score", "regression")
        print(f"   ✅ ML model trained: R²={result['metrics']['r2_score']:.3f}")
        print(f"   📁 Model saved: {result['artifactPath']}")
    except Exception as e:
        print(f"   ❌ Machine learning failed: {e}")
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    test_all_operations()
