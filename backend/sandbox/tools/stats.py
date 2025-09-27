# backend/sandbox/tools/stats.py
from __future__ import annotations
from typing import Dict, Any, List
import os
import pandas as pd
import numpy as np

def _resolve_dataset_path(dataset_id: str) -> str:
    parquet_path = os.path.join("uploads", f"{dataset_id}.parquet")
    csv_path = os.path.join("uploads", f"{dataset_id}.csv")
    if os.path.exists(parquet_path):
        return parquet_path
    if os.path.exists(csv_path):
        return csv_path
    raise FileNotFoundError(f"Dataset {dataset_id} not found under uploads/")

def _load_df(path: str) -> pd.DataFrame:
    if path.endswith(".parquet"):
        return pd.read_parquet(path)
    return pd.read_csv(path)

def compute_summary_stats(dataset_path_or_id: str, column: str) -> Dict[str, Any]:
    """
    If dataset_path_or_id is a path, it will be used directly.
    If it's a bare ID, we try uploads/{id}.parquet or uploads/{id}.csv.
    Returns: {
      "mean": float, "median": float, "std": float, "nullPct": float,
      "histogram": List[{"bin_start": float, "bin_end": float, "count": int, "bin_center": float}]
    }
    """
    # Accept either path or id
    if os.path.exists(dataset_path_or_id):
        path = dataset_path_or_id
    else:
        path = _resolve_dataset_path(dataset_path_or_id)

    df = _load_df(path)
    if column not in df.columns:
        # Column missing — return safe defaults
        return {
            "mean": 0.0, "median": 0.0, "std": 0.0, "nullPct": 0.0, "histogram": []
        }

    series = df[column]
    # If non-numeric, coerce to numeric for stats
    if not pd.api.types.is_numeric_dtype(series):
        series = pd.to_numeric(series, errors="coerce")

    total = len(series)
    null_cnt = int(series.isna().sum())
    clean = series.dropna()

    if len(clean) == 0:
        return {
            "mean": 0.0, "median": 0.0, "std": 0.0,
            "nullPct": (null_cnt / total) * 100.0 if total > 0 else 0.0,
            "histogram": []
        }

    mean_val = float(clean.mean())
    median_val = float(clean.median())
    std_val = float(clean.std())

    # Build a simple 10-bin histogram
    bins = 10
    min_val, max_val = float(clean.min()), float(clean.max())
    if max_val == min_val:
        # Degenerate case: single value
        histogram = [{
            "bin_start": min_val, "bin_end": max_val, "count": int(len(clean)), "bin_center": min_val
        }]
    else:
        edges = np.linspace(min_val, max_val, bins + 1)
        counts, _ = np.histogram(clean, bins=edges)
        histogram = []
        for i in range(bins):
            bin_start = float(edges[i])
            bin_end = float(edges[i + 1])
            count = int(counts[i])
            bin_center = float((bin_start + bin_end) / 2.0)
            histogram.append({
                "bin_start": bin_start, "bin_end": bin_end,
                "count": count, "bin_center": bin_center
            })

    return {
        "mean": mean_val,
        "median": median_val,
        "std": std_val,
        "nullPct": (null_cnt / total) * 100.0 if total > 0 else 0.0,
        "histogram": histogram
    }