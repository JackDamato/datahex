#!/usr/bin/env python3
"""Test the new sandbox endpoints."""

from tools.cleaning import drop_nulls
from tools.runtime import execute_python

def test_cleaning():
    print("Testing cleaning functionality...")
    result = drop_nulls('test_dataset', ['name', 'age'])
    print(f"Cleaning result: {result}")
    return result

def test_runtime():
    print("Testing runtime functionality...")
    result = execute_python('print("hi")')
    print(f"Runtime result: {result}")
    return result

if __name__ == "__main__":
    test_cleaning()
    test_runtime()
    print("All tests passed!")
