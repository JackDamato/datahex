import os
import hashlib
import pandas as pd
from typing import List, Optional, Dict, Any

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def _dataset_path(dataset_id: str) -> str:
    parquet = os.path.join(UPLOADS_DIR, f"{dataset_id}.parquet")
    csv = os.path.join(UPLOADS_DIR, f"{dataset_id}.csv")
    if os.path.exists(parquet):
        return parquet
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

def get_dataset_info(dataset_id: str) -> Dict[str, Any]:
    path = _dataset_path(dataset_id)
    if path.endswith(".parquet"):
        df = pd.read_parquet(path)
    else:
        df = pd.read_csv(path)
    dtypes = {c: str(t) for c, t in df.dtypes.items()}
    return {"rows": int(df.shape[0]), "columns": int(df.shape[1]), "dtypes": dtypes}

def drop_nulls(dataset_id: str, columns: Optional[List[str]] = None) -> Dict[str, Any]:
    path = _dataset_path(dataset_id)
    df = pd.read_parquet(path) if path.endswith(".parquet") else pd.read_csv(path)

    if columns:
        # Only keep columns that exist; log or ignore unknown
        cols_exist = [c for c in columns if c in df.columns]
        if not cols_exist:
            # If none exist, do not drop anything; return original as new copy
            op_desc = f"drop_nulls_none_{dataset_id}"
            return _save_df(df.copy(), dataset_id, op_desc)
        cleaned = df.dropna(subset=cols_exist)
        op_desc = f"drop_nulls_{dataset_id}_{'_'.join(cols_exist)}"
        return _save_df(cleaned, dataset_id, op_desc)
    else:
        cleaned = df.dropna()
        op_desc = f"drop_nulls_all_{dataset_id}"
        return _save_df(cleaned, dataset_id, op_desc)