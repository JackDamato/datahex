# backend/sandbox/tools/runtime.py
from __future__ import annotations
from typing import Dict, Any
import subprocess
import tempfile
import textwrap
import os
import json
import pandas as pd

def execute_python(code: str) -> Dict[str, Any]:
    """
    Run arbitrary Python code in a subprocess.
    Returns { stdout, stderr, returncode }.
    This is a simple, sandbox-lite runner; harden for production.
    """
    # Write code to a temp file and run it with python
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = os.path.join(tmpdir, "snippet.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(textwrap.dedent(code))
        proc = subprocess.run(
            ["python3", script_path],
            capture_output=True,
            text=True,
            timeout=60
        )
        return {
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode
        }

def execute_python_on_dataset(dataset_id: str, code: str) -> Dict[str, Any]:
    """
    Load dataset into df, execute user code that mutates df, then save df and return info.
    User code can reference a pandas DataFrame variable named 'df'.
    Returns:
      {
        "status": "ok"|"error",
        "newDatasetId": str | None,
        "stdout": str,
        "stderr": str,
        "summary": str
      }
    """
    # Resolve dataset path (csv or parquet under uploads/)
    parquet_path = os.path.join("uploads", f"{dataset_id}.parquet")
    csv_path = os.path.join("uploads", f"{dataset_id}.csv")
    if os.path.exists(parquet_path):
        df = pd.read_parquet(parquet_path)
        ext = "parquet"
        src_path = parquet_path
    elif os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        ext = "csv"
        src_path = csv_path
    else:
        return {
            "status": "error",
            "newDatasetId": None,
            "stdout": "",
            "stderr": f"Dataset {dataset_id} not found in uploads/",
            "summary": ""
        }

    # Prepare a temp working directory to run code
    with tempfile.TemporaryDirectory() as tmpdir:
        # Provide a small harness script that:
        # - loads df from JSON (for isolation) OR just inject df via pickle/feather; here we just inline to CSV
        # - executes the user code in a safe-ish namespace
        df_in_path = os.path.join(tmpdir, "input.csv")
        df_out_path = os.path.join(tmpdir, "output.csv")
        df.to_csv(df_in_path, index=False)

        harness = f"""
import pandas as pd
import json, sys

# Load df
df = pd.read_csv(r\"{df_in_path}\")

# --- BEGIN USER CODE ---
{code}
# --- END USER CODE ---

# Save df
df.to_csv(r\"{df_out_path}\", index=False)

print("OK")
"""
        script_path = os.path.join(tmpdir, "harness.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(harness)

        proc = subprocess.run(
            ["python3", script_path],
            capture_output=True,
            text=True,
            timeout=120
        )

        status = "ok" if proc.returncode == 0 else "error"
        stdout = proc.stdout
        stderr = proc.stderr

        new_id = None
        summary = ""
        if status == "ok" and os.path.exists(df_out_path):
            # Save to uploads with a new id
            os.makedirs("uploads", exist_ok=True)
            new_id = f"{dataset_id}_runtime"
            if ext == "parquet":
                # Convert csv back to parquet if desired; here we keep csv for simplicity
                final_path = os.path.join("uploads", f"{new_id}.csv")
            else:
                final_path = os.path.join("uploads", f"{new_id}.csv")

            pd.read_csv(df_out_path).to_csv(final_path, index=False)
            summary = f"Wrote {final_path}"

        return {
            "status": status,
            "newDatasetId": new_id,
            "stdout": stdout,
            "stderr": stderr,
            "summary": summary
        }