"""
Correlation Analysis Tool

This module provides comprehensive correlation analysis capabilities including:
- Pearson and Spearman correlation matrices
- Statistical significance testing
- Trend analysis
- Heatmap data generation
- Comprehensive insights generation
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import os
from datetime import datetime
from scipy import stats
from scipy.stats import pearsonr, spearmanr
import json

def load_dataset(dataset_path: str) -> pd.DataFrame:
    """
    Load dataset from file path.
    
    Args:
        dataset_path (str): Path to the dataset file
        
    Returns:
        pd.DataFrame: Loaded dataset
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
    
    file_extension = os.path.splitext(dataset_path)[1].lower()
    
    if file_extension == '.csv':
        return pd.read_csv(dataset_path)
    elif file_extension in ['.parquet', '.pq']:
        return pd.read_parquet(dataset_path)
    elif file_extension in ['.xlsx', '.xls']:
        return pd.read_excel(dataset_path)
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")

def analyze_correlations(
    dataset_path: str, 
    columns: Optional[List[str]] = None,
    analysis_type: str = 'comprehensive'
) -> Dict[str, Any]:
    """
    Perform comprehensive correlation analysis.
    
    Args:
        dataset_path (str): Path to the dataset file
        columns (List[str], optional): List of columns to analyze. If None, uses all numeric columns.
        analysis_type (str): Type of analysis - 'quick', 'comprehensive', or 'detailed'
    
    Returns:
        Dict[str, Any]: Comprehensive correlation analysis results
    """
    try:
        # Load dataset
        df = load_dataset(dataset_path)
        original_shape = df.shape
        
        # Select numeric columns
        if columns is None:
            numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            numeric_columns = [col for col in columns if col in df.columns and pd.api.types.is_numeric_dtype(df[col])]
        
        if len(numeric_columns) < 2:
            raise ValueError("Need at least 2 numeric columns for correlation analysis")
        
        # Clean data (remove rows with any NaN values in numeric columns)
        clean_df = df[numeric_columns].dropna()
        clean_shape = clean_df.shape
        
        # Compute correlation matrices
        pearson_matrix = clean_df.corr(method='pearson')
        spearman_matrix = clean_df.corr(method='spearman')
        
        # Find correlations
        correlations = find_significant_correlations(clean_df, numeric_columns, analysis_type)
        
        # Generate heatmap data
        heatmap_data = generate_heatmap_data(pearson_matrix, numeric_columns)
        
        # Analyze trends
        trends = analyze_trends(clean_df, numeric_columns)
        
        # Generate statistics
        statistics = generate_statistics(clean_df, pearson_matrix, spearman_matrix)
        
        # Generate insights
        insights = generate_insights(correlations, trends, statistics, analysis_type)
        
        # Generate visualization data
        visualization_data = generate_visualization_data(pearson_matrix, numeric_columns)
        
        return {
            "analysis_type": analysis_type,
            "dataset_info": {
                "original_shape": list(original_shape),
                "clean_shape": list(clean_shape),
                "columns_analyzed": numeric_columns,
                "timestamp": datetime.now().isoformat()
            },
            "correlation_matrices": {
                "pearson": pearson_matrix.to_dict(),
                "spearman": spearman_matrix.to_dict()
            },
            "heatmap_data": heatmap_data,
            "correlations": correlations,
            "trends": trends,
            "statistics": statistics,
            "insights": insights,
            "visualization_data": visualization_data
        }
        
    except Exception as e:
        raise ValueError(f"Correlation analysis failed: {str(e)}")

def find_significant_correlations(
    df: pd.DataFrame, 
    columns: List[str], 
    analysis_type: str
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Find significant correlations between columns.
    
    Args:
        df (pd.DataFrame): Clean dataset
        columns (List[str]): List of numeric columns
        analysis_type (str): Type of analysis
        
    Returns:
        Dict[str, List[Dict]]: Strong and moderate correlations
    """
    strong_correlations = []
    moderate_correlations = []
    
    # Define thresholds based on analysis type
    if analysis_type == 'quick':
        strong_threshold = 0.8
        moderate_threshold = 0.5
    elif analysis_type == 'detailed':
        strong_threshold = 0.7
        moderate_threshold = 0.4
    else:  # comprehensive
        strong_threshold = 0.7
        moderate_threshold = 0.5
    
    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            col1, col2 = columns[i], columns[j]
            
            # Calculate Pearson correlation
            corr_val, p_value = pearsonr(df[col1], df[col2])
            
            # Determine significance
            if p_value < 0.001:
                significance = "highly significant"
            elif p_value < 0.01:
                significance = "significant"
            elif p_value < 0.05:
                significance = "marginally significant"
            else:
                significance = "not significant"
            
            # Determine direction
            direction = "positive" if corr_val > 0 else "negative"
            
            # Determine strength
            abs_corr = abs(corr_val)
            if abs_corr >= strong_threshold:
                strength = "strong"
            elif abs_corr >= moderate_threshold:
                strength = "moderate"
            else:
                strength = "weak"
            
            correlation_info = {
                "column1": col1,
                "column2": col2,
                "correlation": float(corr_val),
                "strength": strength,
                "direction": direction,
                "significance": significance,
                "p_value": float(p_value)
            }
            
            if abs_corr >= strong_threshold:
                strong_correlations.append(correlation_info)
            elif abs_corr >= moderate_threshold:
                moderate_correlations.append(correlation_info)
    
    # Sort by absolute correlation value
    strong_correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    moderate_correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    return {
        "strong": strong_correlations,
        "moderate": moderate_correlations
    }

def generate_heatmap_data(corr_matrix: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Generate heatmap data for visualization.
    
    Args:
        corr_matrix (pd.DataFrame): Correlation matrix
        columns (List[str]): Column names
        
    Returns:
        Dict[str, Any]: Heatmap data
    """
    matrix = corr_matrix.values.tolist()
    
    # Generate color data
    colors = []
    for row in matrix:
        color_row = []
        for val in row:
            if val >= 0:
                intensity = abs(val)
                color = f"rgba(255, 0, 0, {intensity})"  # Red for positive
            else:
                intensity = abs(val)
                color = f"rgba(0, 0, 255, {intensity})"  # Blue for negative
            
            color_row.append({
                "value": val,
                "intensity": intensity,
                "color": color
            })
        colors.append(color_row)
    
    return {
        "columns": columns,
        "matrix": matrix,
        "colors": colors,
        "color_scale": {
            "min": -1.0,
            "max": 1.0,
            "neutral": 0.0
        }
    }

def analyze_trends(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Analyze linear trends in the data.
    
    Args:
        df (pd.DataFrame): Clean dataset
        columns (List[str]): Numeric columns
        
    Returns:
        Dict[str, Any]: Trend analysis results
    """
    linear_trends = []
    
    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            col1, col2 = columns[i], columns[j]
            
            # Calculate linear regression
            slope, intercept, r_value, p_value, std_err = stats.linregress(df[col1], df[col2])
            
            # Determine trend strength
            if abs(r_value) >= 0.7:
                trend_strength = "strong"
            elif abs(r_value) >= 0.5:
                trend_strength = "moderate"
            else:
                trend_strength = "weak"
            
            # Determine trend direction
            trend_direction = "increasing" if slope > 0 else "decreasing"
            
            linear_trends.append({
                "column1": col1,
                "column2": col2,
                "slope": float(slope),
                "intercept": float(intercept),
                "r_squared": float(r_value ** 2),
                "p_value": float(p_value),
                "trend_strength": trend_strength,
                "trend_direction": trend_direction
            })
    
    # Sort by R-squared value
    linear_trends.sort(key=lambda x: x['r_squared'], reverse=True)
    
    return {
        "linear_trends": linear_trends
    }

def generate_statistics(
    df: pd.DataFrame, 
    pearson_matrix: pd.DataFrame, 
    spearman_matrix: pd.DataFrame
) -> Dict[str, Any]:
    """
    Generate statistical summary.
    
    Args:
        df (pd.DataFrame): Clean dataset
        pearson_matrix (pd.DataFrame): Pearson correlation matrix
        spearman_matrix (pd.DataFrame): Spearman correlation matrix
        
    Returns:
        Dict[str, Any]: Statistical summary
    """
    # Calculate matrix statistics
    pearson_values = pearson_matrix.values
    spearman_values = spearman_matrix.values
    
    # Remove diagonal values (self-correlations)
    mask = ~np.eye(pearson_values.shape[0], dtype=bool)
    pearson_off_diag = pearson_values[mask]
    spearman_off_diag = spearman_values[mask]
    
    return {
        "pearson_stats": {
            "mean": float(np.mean(pearson_off_diag)),
            "std": float(np.std(pearson_off_diag)),
            "min": float(np.min(pearson_off_diag)),
            "max": float(np.max(pearson_off_diag)),
            "median": float(np.median(pearson_off_diag))
        },
        "spearman_stats": {
            "mean": float(np.mean(spearman_off_diag)),
            "std": float(np.std(spearman_off_diag)),
            "min": float(np.min(spearman_off_diag)),
            "max": float(np.max(spearman_off_diag)),
            "median": float(np.median(spearman_off_diag))
        },
        "data_quality": {
            "total_rows": len(df),
            "numeric_columns": len(df.select_dtypes(include=[np.number]).columns),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum())
        }
    }

def generate_insights(
    correlations: Dict[str, List[Dict]], 
    trends: Dict[str, Any], 
    statistics: Dict[str, Any],
    analysis_type: str
) -> List[str]:
    """
    Generate actionable insights from correlation analysis.
    
    Args:
        correlations (Dict): Correlation results
        trends (Dict): Trend analysis results
        statistics (Dict): Statistical summary
        analysis_type (str): Type of analysis
        
    Returns:
        List[str]: Generated insights
    """
    insights = []
    
    # Strong correlation insights
    strong_corr = correlations.get('strong', [])
    if strong_corr:
        insights.append(f"Found {len(strong_corr)} strong correlations (|r| ≥ 0.7)")
        strongest = strong_corr[0]
        insights.append(f"Strongest correlation: {strongest['column1']} vs {strongest['column2']} (r = {strongest['correlation']:.3f})")
    
    # Moderate correlation insights
    moderate_corr = correlations.get('moderate', [])
    if moderate_corr:
        insights.append(f"Found {len(moderate_corr)} moderate correlations (0.5 ≤ |r| < 0.7)")
    
    # Trend insights
    linear_trends = trends.get('linear_trends', [])
    if linear_trends:
        strongest_trend = linear_trends[0]
        insights.append(f"Strongest linear trend: {strongest_trend['column1']} vs {strongest_trend['column2']} (R² = {strongest_trend['r_squared']:.3f})")
    
    # Data quality insights
    data_quality = statistics.get('data_quality', {})
    if data_quality.get('missing_values', 0) > 0:
        insights.append(f"Dataset has {data_quality['missing_values']} missing values that were removed for analysis")
    
    if data_quality.get('duplicate_rows', 0) > 0:
        insights.append(f"Dataset contains {data_quality['duplicate_rows']} duplicate rows")
    
    # Statistical insights
    pearson_stats = statistics.get('pearson_stats', {})
    if pearson_stats:
        mean_corr = pearson_stats.get('mean', 0)
        if abs(mean_corr) > 0.3:
            insights.append(f"Overall correlation tendency: {'positive' if mean_corr > 0 else 'negative'} (mean r = {mean_corr:.3f})")
    
    # Analysis type specific insights
    if analysis_type == 'detailed':
        insights.append("Detailed analysis completed with statistical significance testing")
    elif analysis_type == 'quick':
        insights.append("Quick analysis completed with basic correlation detection")
    else:
        insights.append("Comprehensive analysis completed with trend analysis and insights")
    
    return insights

def generate_visualization_data(corr_matrix: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
    """
    Generate data for visualization components.
    
    Args:
        corr_matrix (pd.DataFrame): Correlation matrix
        columns (List[str]): Column names
        
    Returns:
        Dict[str, Any]: Visualization data
    """
    return {
        "heatmap_ready": True,
        "scatter_plot_data": {
            "available_pairs": len(columns) * (len(columns) - 1) // 2,
            "columns": columns
        },
        "correlation_matrix_plot": {
            "data": corr_matrix.values.tolist(),
            "labels": columns,
            "title": "Correlation Matrix Heatmap"
        }
    }

def generate_correlation_report(dataset_path: str) -> Dict[str, Any]:
    """
    Generate comprehensive correlation analysis report.
    
    Args:
        dataset_path (str): Path to the dataset file
        
    Returns:
        Dict[str, Any]: HTML report and metadata
    """
    try:
        # Perform comprehensive analysis
        analysis_results = analyze_correlations(dataset_path, analysis_type='comprehensive')
        
        # Generate HTML report
        html_report = generate_html_report(analysis_results)
        
        # Save report
        report_path = f"uploads/correlation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_report)
        
        return {
            "report_path": report_path,
            "html_report": html_report,
            "analysis_summary": {
                "strong_correlations": len(analysis_results['correlations']['strong']),
                "moderate_correlations": len(analysis_results['correlations']['moderate']),
                "linear_trends": len(analysis_results['trends']['linear_trends']),
                "insights_count": len(analysis_results['insights'])
            }
        }
        
    except Exception as e:
        raise ValueError(f"Report generation failed: {str(e)}")

def generate_html_report(analysis_results: Dict[str, Any]) -> str:
    """
    Generate HTML report from analysis results.
    
    Args:
        analysis_results (Dict): Analysis results
        
    Returns:
        str: HTML report content
    """
    dataset_info = analysis_results['dataset_info']
    correlations = analysis_results['correlations']
    insights = analysis_results['insights']
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Correlation Analysis Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
            .section {{ margin: 20px 0; }}
            .correlation {{ background-color: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 3px; }}
            .insight {{ background-color: #e8f4f8; padding: 10px; margin: 5px 0; border-radius: 3px; }}
            .strong {{ border-left: 4px solid #ff6b6b; }}
            .moderate {{ border-left: 4px solid #4ecdc4; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Correlation Analysis Report</h1>
            <p>Generated on: {dataset_info['timestamp']}</p>
            <p>Dataset: {dataset_info['original_shape'][0]} rows × {dataset_info['original_shape'][1]} columns</p>
            <p>Analyzed: {dataset_info['clean_shape'][0]} rows × {len(dataset_info['columns_analyzed'])} numeric columns</p>
        </div>
        
        <div class="section">
            <h2>Strong Correlations</h2>
            {''.join([f'<div class="correlation strong"><strong>{c["column1"]}</strong> vs <strong>{c["column2"]}</strong>: {c["correlation"]:.3f} ({c["direction"]}, {c["significance"]})</div>' for c in correlations['strong']])}
        </div>
        
        <div class="section">
            <h2>Moderate Correlations</h2>
            {''.join([f'<div class="correlation moderate"><strong>{c["column1"]}</strong> vs <strong>{c["column2"]}</strong>: {c["correlation"]:.3f} ({c["direction"]}, {c["significance"]})</div>' for c in correlations['moderate']])}
        </div>
        
        <div class="section">
            <h2>Key Insights</h2>
            {''.join([f'<div class="insight">{insight}</div>' for insight in insights])}
        </div>
    </body>
    </html>
    """
    
    return html
