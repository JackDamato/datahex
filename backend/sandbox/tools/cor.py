import os
import json
import hashlib
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import seaborn as sns

from .cleaning import _dataset_path

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def _ensure_df(dataset_id_or_path: str) -> pd.DataFrame:
    if os.path.isfile(dataset_id_or_path):
        path = dataset_id_or_path
    else:
        path = _dataset_path(dataset_id_or_path)
    df = pd.read_parquet(path) if path.endswith(".parquet") else pd.read_csv(path)
    return df

def _numeric_df(df: pd.DataFrame, columns: Optional[List[str]]) -> pd.DataFrame:
    if columns:
        cols = [c for c in columns if c in df.columns]
        df = df[cols]
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    return df[num_cols]

def analyze_correlations(dataset_id_or_path: str, columns: Optional[List[str]], analysis_type: str) -> Dict[str, Any]:
    df = _ensure_df(dataset_id_or_path)
    num_df = _numeric_df(df, columns)

    if num_df.empty or num_df.shape[1] < 1:
        return {
            "analysis_type": analysis_type,
            "dataset_info": {"rows": int(df.shape[0]), "columns": list(df.columns)},
            "correlation_matrices": {},
            "heatmap_data": {},
            "correlations": {},
            "trends": {},
            "statistics": {},
            "insights": ["No numeric columns available for correlation analysis."],
            "visualization_data": {},
        }

    pearson = num_df.corr(method="pearson").fillna(0).round(4)
    spearman = num_df.corr(method="spearman").fillna(0).round(4)
    kendall = num_df.corr(method="kendall").fillna(0).round(4)

    # Build simple insights
    insights = []
    tri = pearson.where(np.triu(np.ones(pearson.shape), k=1).astype(bool))
    tops = tri.unstack().dropna().sort_values(ascending=False)
    for (a, b), v in tops.head(5).items():
        insights.append(f"Strong positive relationship between {a} and {b} (pearson={v:.2f})")
    for (a, b), v in tops.tail(5).items():
        insights.append(f"Strong negative relationship between {a} and {b} (pearson={v:.2f})")

    heatmap_data = {
        "pearson": pearson.to_dict(),
        "spearman": spearman.to_dict(),
        "kendall": kendall.to_dict(),
    }

    return {
        "analysis_type": analysis_type,
        "dataset_info": {"rows": int(df.shape[0]), "columns": list(df.columns)},
        "correlation_matrices": heatmap_data,
        "heatmap_data": heatmap_data,
        "correlations": {"pearson_top_pairs": [(str(k[0]), str(k[1]), float(v)) for k, v in tops.head(10).items()]},
        "trends": {},
        "statistics": {},
        "insights": insights,
        "visualization_data": {},
    }

def create_correlation_report(dataset_id_or_path: str, columns: Optional[List[str]]) -> str:
    result = analyze_correlations(dataset_id_or_path, columns, analysis_type="report")
    # Very basic HTML report
    html = [
        "<html><head><title>Correlation Report</title></head><body>",
        "<h1>Correlation Report</h1>",
        f"<p>Rows: {result['dataset_info']['rows']}</p>",
        f"<p>Columns: {', '.join(map(str, result['dataset_info']['columns']))}</p>",
        "<h2>Top Pearson Pairs</h2><ul>",
    ]
    for a, b, v in result["correlations"].get("pearson_top_pairs", []):
        html.append(f"<li>{a} vs {b}: {v:.3f}</li>")
    html.append("</ul></body></html>")
    return "\n".join(html)

def create_test_correlation_dataset(dataset_id: str) -> str:
    # Create a small synthetic dataset and save to uploads to allow demo flows
    np.random.seed(42)
    n = 200
    x = np.random.normal(0, 1, size=n)
    y = 0.7 * x + np.random.normal(0, 0.5, size=n)
    z = np.random.normal(0, 1, size=n)
    df = pd.DataFrame({"x": x, "y": y, "z": z})
    path = os.path.join(UPLOADS_DIR, f"{dataset_id}.parquet")
    df.to_parquet(path, index=False)
    return path