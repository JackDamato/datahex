#!/usr/bin/env python3
"""
Data Science Copilot Python Sandbox
Main entry point for Python-based data science operations
"""

import sys
import os
import asyncio
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np

class DataScienceSandbox:
    """Main sandbox class for data science operations"""
    
    def __init__(self):
        self.data: Optional[pd.DataFrame] = None
        self.results: Dict[str, Any] = {}
    
    async def load_data(self, file_path: str) -> bool:
        """Load data from various file formats"""
        try:
            if file_path.endswith('.csv'):
                self.data = pd.read_csv(file_path)
            elif file_path.endswith('.json'):
                self.data = pd.read_json(file_path)
            elif file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                self.data = pd.read_excel(file_path)
            else:
                print(f"Unsupported file format: {file_path}")
                return False
            
            print(f"✅ Data loaded successfully: {self.data.shape[0]} rows, {self.data.shape[1]} columns")
            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    async def basic_stats(self) -> Dict[str, Any]:
        """Generate basic statistics for the loaded dataset"""
        if self.data is None:
            return {"error": "No data loaded"}
        
        stats = {
            "shape": self.data.shape,
            "columns": list(self.data.columns),
            "dtypes": self.data.dtypes.to_dict(),
            "missing_values": self.data.isnull().sum().to_dict(),
            "numeric_summary": self.data.describe().to_dict() if not self.data.select_dtypes(include=[np.number]).empty else {}
        }
        
        self.results["basic_stats"] = stats
        return stats
    
    async def clean_data(self) -> Dict[str, Any]:
        """Basic data cleaning operations"""
        if self.data is None:
            return {"error": "No data loaded"}
        
        original_shape = self.data.shape
        cleaned_data = self.data.copy()
        
        # Remove completely empty rows
        cleaned_data = cleaned_data.dropna(how='all')
        
        # Fill numeric columns with median
        numeric_columns = cleaned_data.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            cleaned_data[col].fillna(cleaned_data[col].median(), inplace=True)
        
        # Fill categorical columns with mode
        categorical_columns = cleaned_data.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            mode_value = cleaned_data[col].mode()
            if not mode_value.empty:
                cleaned_data[col].fillna(mode_value[0], inplace=True)
        
        self.data = cleaned_data
        
        cleaning_results = {
            "original_shape": original_shape,
            "cleaned_shape": cleaned_data.shape,
            "rows_removed": original_shape[0] - cleaned_data.shape[0],
            "columns_processed": len(numeric_columns) + len(categorical_columns)
        }
        
        self.results["cleaning"] = cleaning_results
        return cleaning_results
    
    async def generate_visualization(self, chart_type: str = "histogram") -> Dict[str, Any]:
        """Generate basic visualizations"""
        if self.data is None:
            return {"error": "No data loaded"}
        
        # This is a placeholder - in a real implementation, this would generate actual charts
        viz_results = {
            "chart_type": chart_type,
            "status": "placeholder",
            "message": "Visualization generation would happen here",
            "data_shape": self.data.shape
        }
        
        self.results["visualization"] = viz_results
        return viz_results
    
    async def run_analysis(self, analysis_type: str) -> Dict[str, Any]:
        """Run different types of analysis"""
        if self.data is None:
            return {"error": "No data loaded"}
        
        if analysis_type == "correlation":
            numeric_data = self.data.select_dtypes(include=[np.number])
            if not numeric_data.empty:
                correlation_matrix = numeric_data.corr().to_dict()
                return {"correlation_matrix": correlation_matrix}
            else:
                return {"error": "No numeric columns for correlation analysis"}
        
        elif analysis_type == "summary":
            return await self.basic_stats()
        
        else:
            return {"error": f"Unknown analysis type: {analysis_type}"}

async def main():
    """Main function for testing the sandbox"""
    print("🐍 Data Science Copilot Python Sandbox")
    print("=" * 50)
    
    sandbox = DataScienceSandbox()
    
    # Example usage
    print("📊 Sandbox initialized successfully")
    print("💡 Ready to process data science operations")
    
    # In a real implementation, this would receive commands from the backend
    # For now, just show that the sandbox is working
    print("✅ Sandbox is ready for agent integration")

if __name__ == "__main__":
    asyncio.run(main())