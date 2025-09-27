import os
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score, mean_squared_error, r2_score
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR

from .cleaning import _dataset_path

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def _ensure_df(dataset_id_or_path: str) -> pd.DataFrame:
    if os.path.isfile(dataset_id_or_path):
        path = dataset_id_or_path
    else:
        path = _dataset_path(dataset_id_or_path)
    return pd.read_parquet(path) if path.endswith(".parquet") else pd.read_csv(path)

def _split_features(df: pd.DataFrame, features: List[str]) -> (List[str], List[str]):
    num = []
    cat = []
    for c in features:
        if c not in df.columns:
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            num.append(c)
        else:
            cat.append(c)
    return num, cat

def _build_model(algorithm: str, model_type: str):
    algorithm = algorithm.lower()
    if model_type == "classification":
        if algorithm in ["random_forest", "rf"]:
            return RandomForestClassifier(n_estimators=200, random_state=42)
        if algorithm in ["logistic_regression", "logreg", "lr"]:
            return LogisticRegression(max_iter=1000)
        if algorithm in ["svc", "svm"]:
            return SVC(probability=True)
        if algorithm in ["gb", "gradient_boosting"]:
            return GradientBoostingClassifier(random_state=42)
        # default
        return RandomForestClassifier(n_estimators=200, random_state=42)
    else:
        if algorithm in ["random_forest", "rf"]:
            return RandomForestRegressor(n_estimators=200, random_state=42)
        if algorithm in ["linear_regression", "linreg", "lr"]:
            return LinearRegression()
        if algorithm in ["svr", "svm"]:
            return SVR()
        if algorithm in ["gbr", "gradient_boosting"]:
            return GradientBoostingRegressor(random_state=42)
        # default
        return RandomForestRegressor(n_estimators=200, random_state=42)

def _build_pipeline(df: pd.DataFrame, features: List[str], model):
    num, cat = _split_features(df, features)
    preprocess = ColumnTransformer(
        transformers=[
            ("num", "passthrough", num),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat),
        ]
    )
    pipe = Pipeline(steps=[("prep", preprocess), ("model", model)])
    return pipe, num, cat

def _compute_metrics(model_type: str, y_true, y_pred, y_proba=None) -> Dict[str, Any]:
    if model_type == "classification":
        metrics = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "f1": float(f1_score(y_true, y_pred, average="weighted")),
        }
        # Optional ROC-AUC for binary
        try:
            if y_proba is not None and len(np.unique(y_true)) == 2:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba[:, 1]))
        except Exception:
            pass
        return metrics
    else:
        return {
            "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
            "r2": float(r2_score(y_true, y_pred)),
        }

def train_model(dataset_id_or_path: str,
                features: List[str],
                target: str,
                model_type: str,
                algorithm: str,
                test_size: float,
                random_state: int,
                hyperparameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    df = _ensure_df(dataset_id_or_path)
    cols = [c for c in features if c in df.columns]
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found.")
    X = df[cols]
    y = df[target]

    base_model = _build_model(algorithm, model_type)
    pipe, num, cat = _build_pipeline(df, cols, base_model)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y if model_type == "classification" else None
    )

    if hyperparameters:
        # Apply GridSearch on model__<param>
        param_grid = {f"model__{k}": v for k, v in hyperparameters.items()}
        gs = GridSearchCV(pipe, param_grid=param_grid, cv=3, n_jobs=-1)
        gs.fit(X_train, y_train)
        best_pipe = gs.best_estimator_
        best_params = gs.best_params_
    else:
        pipe.fit(X_train, y_train)
        best_pipe = pipe
        best_params = {}

    y_pred = best_pipe.predict(X_test)
    y_proba = None
    if model_type == "classification":
        try:
            y_proba = best_pipe.predict_proba(X_test)
        except Exception:
            y_proba = None

    metrics = _compute_metrics(model_type, y_test, y_pred, y_proba)

    # Feature importances if available
    feat_imp = {}
    try:
        model = best_pipe.named_steps["model"]
        if hasattr(model, "feature_importances_"):
            # After preprocessing, categories expanded. For simplicity map back to feature names.
            importances = model.feature_importances_
            base_names = num.copy()
            if cat:
                # Not expanding category levels here; aggregate by original cat columns
                per_num = dict(zip(num, importances[:len(num)]))
                rest = importances[len(num):]
                # Aggregate rest equally among categorical columns
                if len(cat) > 0 and len(rest) > 0:
                    per_cat_share = float(rest.mean()) if len(rest) > 0 else 0.0
                    for c in cat:
                        per_num[c] = per_num.get(c, 0.0) + per_cat_share
                feat_imp = {k: float(v) for k, v in per_num.items()}
            else:
                feat_imp = {k: float(v) for k, v in zip(num, importances)}
    except Exception:
        pass

    return {
        "model_info": {"algorithm": algorithm, "best_params": best_params},
        "metrics": metrics,
        "feature_importance": feat_imp,
        "cross_validation": {},
        "visualizations": {},
        "model_metadata": {"features": cols, "target": target, "model_type": model_type},
    }

def hyperparameter_tuning(dataset_id_or_path: str,
                          features: List[str],
                          target: str,
                          model_type: str,
                          algorithm: str,
                          param_grid: Dict[str, List[Any]]) -> Dict[str, Any]:
    df = _ensure_df(dataset_id_or_path)
    cols = [c for c in features if c in df.columns]
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found.")
    X = df[cols]
    y = df[target]

    base_model = _build_model(algorithm, model_type)
    pipe, _, _ = _build_pipeline(df, cols, base_model)

    gs = GridSearchCV(pipe, param_grid={f"model__{k}": v for k, v in param_grid.items()}, cv=3, n_jobs=-1)
    gs.fit(X, y)

    return {
        "best_params": gs.best_params_,
        "best_score": float(gs.best_score_),
        "cv_results": {k: (v.tolist() if hasattr(v, "tolist") else v) for k, v in gs.cv_results_.items()},
    }

def model_comparison(dataset_id_or_path: str,
                     features: List[str],
                     target: str,
                     model_type: str,
                     algorithms: List[str]) -> Dict[str, Any]:
    df = _ensure_df(dataset_id_or_path)
    cols = [c for c in features if c in df.columns]
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found.")
    X = df[cols]
    y = df[target]

    results = {}
    for algo in algorithms:
        model = _build_model(algo, model_type)
        pipe, _, _ = _build_pipeline(df, cols, model)
        try:
            scoring = "accuracy" if model_type == "classification" else "r2"
            scores = cross_val_score(pipe, X, y, cv=3, scoring=scoring, n_jobs=-1)
            results[algo] = {"mean": float(scores.mean()), "std": float(scores.std())}
        except Exception as e:
            results[algo] = {"error": str(e)}

    best_algorithm = max(results.items(), key=lambda kv: kv[1].get("mean", -1) if isinstance(kv[1], dict) else -1)[0]
    return {
        "results": results,
        "comparison_summary": {"count": len(results)},
        "best_algorithm": best_algorithm,
    }

def get_model_recommendations(dataset_id_or_path: str, features: List[str], target: str) -> List[Dict[str, Any]]:
    df = _ensure_df(dataset_id_or_path)
    if target not in df.columns:
        return [{"algorithm": "random_forest", "reason": "Robust default, but target not found"}]
    y = df[target]
    if pd.api.types.is_numeric_dtype(y):
        return [
            {"model_type": "regression", "algorithm": "random_forest", "reason": "Nonlinear relationships"},
            {"model_type": "regression", "algorithm": "linear_regression", "reason": "Baseline"},
            {"model_type": "regression", "algorithm": "gbr", "reason": "Strong tabular baseline"},
        ]
    else:
        return [
            {"model_type": "classification", "algorithm": "random_forest", "reason": "Robust default"},
            {"model_type": "classification", "algorithm": "logistic_regression", "reason": "Interpretability"},
            {"model_type": "classification", "algorithm": "gb", "reason": "Strong tabular baseline"},
        ]

def create_test_modeling_dataset(dataset_id: str) -> str:
    np.random.seed(42)
    n = 300
    age = np.random.randint(18, 65, size=n)
    salary = np.random.randint(30000, 150000, size=n)
    score = np.random.normal(70, 10, size=n)
    dept = np.random.choice(["Engineering", "Sales", "HR", "Marketing"], size=n)
    gender = np.random.choice(["Male", "Female"], size=n)
    df = pd.DataFrame({"age": age, "salary": salary, "score": score, "dept": dept, "gender": gender})
    out = os.path.join(UPLOADS_DIR, f"{dataset_id}.parquet")
    df.to_parquet(out, index=False)
    return out