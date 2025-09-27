"""
Create test parquet data for testing the sandbox endpoints.
"""

import pandas as pd
import os

# Create test data with nulls
test_data = pd.DataFrame({
    'name': ['Alice', 'Bob', None, 'Diana', 'Eve', 'Frank', None, 'Grace'],
    'age': [25, 30, None, 35, 28, 42, 33, None],
    'salary': [50000, 60000, 70000, None, 55000, 80000, 65000, 45000],
    'department': ['IT', 'HR', 'IT', 'Finance', None, 'IT', 'HR', 'Finance'],
    'experience_years': [2, 5, None, 8, 3, 12, 6, 1],
    'performance_score': [85, 92, None, 78, 88, 95, 90, 82]
})

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Save as parquet
test_data.to_parquet("uploads/test_dataset.parquet", index=False)

print("Test parquet data created: uploads/test_dataset.parquet")
print(f"Shape: {test_data.shape}")
print(f"Columns: {list(test_data.columns)}")
print(f"Null counts:\n{test_data.isnull().sum()}")
