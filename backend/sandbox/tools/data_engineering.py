# tools/data_engineering.py
import os
import hashlib
from typing import Dict, Any, List, Optional
import pandas as pd

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def _dataset_path(dataset_id: str) -> str:
    pq = os.path.join(UPLOADS_DIR, f"{dataset_id}.parquet")
    csv = os.path.join(UPLOADS_DIR, f"{dataset_id}.csv")
    if os.path.exists(pq):
        return pq
    if os.path.exists(csv):
        return csv
    raise FileNotFoundError(f"Dataset not found for id: {dataset_id}")

def _new_dataset_id(base_id: str, payload: str) -> str:
    h = hashlib.sha1(payload.encode()).hexdigest()[:10]
    return f"{base_id}_op_{h}"

def _save_df(df: pd.DataFrame, base_id: str, op_desc: str) -> Dict[str, Any]:
    new_id = _new_dataset_id(base_id, op_desc)
    out_parquet = os.path.join(UPLOADS_DIR, f"{new_id}.parquet")
    df.to_parquet(out_parquet, index=False)
    return {"newDatasetId": new_id, "rows": int(df.shape[0]), "columns": int(df.shape[1])}

def engineer_data(dataset_id: str, operations: List[Dict[str, Any]], target_column: Optional[str] = None) -> Dict[str, Any]:
    """
    operations examples:
      {"op": "fillna", "columns": ["col1"], "value": 0}
      {"op": "standardize", "columns": ["age","score"]}
      {"op": "one_hot_encode", "columns": ["dept"]}
      {"op": "minmax_scale", "columns": ["salary"], "feature_range": [0,1]}
      {"op": "drop_columns", "columns": ["unused_col"]}
    """
    path = _dataset_path(dataset_id)
    df = pd.read_parquet(path) if path.endswith(".parquet") else pd.read_csv(path)

    original_shape = f"{df.shape[0]}x{df.shape[1]}"
    applied = []

    for op in operations or []:
        kind = op.get("op")
        cols = [c for c in op.get("columns", []) if c in df.columns]
        if not kind:
            continue

        if kind == "fillna":
            value = op.get("value", 0)
            if cols:
                df[cols] = df[cols].fillna(value)
            else:
                df = df.fillna(value)
            applied.append(f"fillna({cols or 'ALL'}, value={value})")

        elif kind == "standardize" and cols:
            for c in cols:
                s = pd.to_numeric(df[c], errors="coerce")
                std = s.std()
                df[c] = (s - s.mean()) / (std if std != 0 else 1)
            applied.append(f"standardize({cols})")

        elif kind == "minmax_scale" and cols:
            fr = op.get("feature_range", [0, 1])
            lo, hi = float(fr[0]), float(fr[1])
            for c in cols:
                s = pd.to_numeric(df[c], errors="coerce")
                minv, maxv = s.min(), s.max()
                if pd.isna(minv) or pd.isna(maxv) or maxv == minv:
                    df[c] = 0.0
                else:
                    df[c] = (s - minv) / (maxv - minv) * (hi - lo) + lo
            applied.append(f"minmax_scale({cols}, range={fr})")

        elif kind == "one_hot_encode" and cols:
            df = pd.get_dummies(df, columns=cols, drop_first=False)
            applied.append(f"one_hot_encode({cols})")

        elif kind == "drop_columns" and cols:
            df = df.drop(columns=cols, errors="ignore")
            applied.append(f"drop_columns({cols})")

        # add more ops as needed...

    saved = _save_df(df, dataset_id, f"engineer_{hash(str(operations))}")
    return {
        "newDatasetId": saved["newDatasetId"],
        "rows": saved["rows"],
        "columns": int(df.shape[1]),
        "operations_applied": applied,
        "feature_importance": {},
        "original_shape": original_shape,
        "new_shape": f"{df.shape[0]}x{df.shape[1]}",
    }