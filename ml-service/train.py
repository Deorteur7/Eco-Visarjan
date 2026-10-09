"""Trains the pollution-risk Random Forest on SYNTHETIC data and saves it.

Run:  python train.py
The API service also calls ensure_model() at startup, so training happens
automatically the first time if no compatible model file exists.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from features import FEATURES
from generate_data import N_SAMPLES, SEED, generate
from risk_formula import level_for

# ---- Tuneable constants -----------------------------------------------------
N_ESTIMATORS = 200
MIN_SAMPLES_LEAF = 3
TEST_SIZE = 0.2
# -----------------------------------------------------------------------------

ROOT = Path(__file__).parent
MODEL_DIR = ROOT / "model"
DATA_DIR = ROOT / "data"
MODEL_PATH = MODEL_DIR / "risk_model.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"
DATA_PATH = DATA_DIR / "synthetic_training_data.csv"


def train(n_samples: int = N_SAMPLES, seed: int = SEED):
    frame = generate(n_samples, seed)
    DATA_DIR.mkdir(exist_ok=True)
    frame.to_csv(DATA_PATH, index=False)

    x_train, x_test, y_train, y_test = train_test_split(
        frame[FEATURES], frame["risk_score"], test_size=TEST_SIZE, random_state=seed
    )
    model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS,
        min_samples_leaf=MIN_SAMPLES_LEAF,
        random_state=seed,
        n_jobs=-1,
    )
    model.fit(x_train, y_train)

    predicted = np.clip(model.predict(x_test), 0, 100)
    true_levels = [level_for(v) for v in y_test]
    predicted_levels = [level_for(v) for v in predicted]
    level_accuracy = float(np.mean([a == b for a, b in zip(true_levels, predicted_levels)]))

    metrics = {
        "model": "RandomForestRegressor",
        "trainedOn": "SYNTHETIC",
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "nSamples": int(n_samples),
        "seed": int(seed),
        "sklearnVersion": sklearn.__version__,
        "holdout": {
            "r2": round(float(r2_score(y_test, predicted)), 4),
            "mae": round(float(mean_absolute_error(y_test, predicted)), 3),
            "levelAccuracy": round(level_accuracy, 4),
        },
        "featureImportances": {
            name: round(float(value), 4) for name, value in zip(FEATURES, model.feature_importances_)
        },
        "note": "Holdout metrics measure agreement with the synthetic generating formula, not real-world accuracy.",
    }
    return model, metrics


def save(model, metrics) -> None:
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))


def ensure_model():
    """Loads the saved model, retraining if missing or built with a different scikit-learn."""
    if MODEL_PATH.exists() and METRICS_PATH.exists():
        metrics = json.loads(METRICS_PATH.read_text())
        if metrics.get("sklearnVersion") == sklearn.__version__:
            return joblib.load(MODEL_PATH), metrics
    model, metrics = train()
    save(model, metrics)
    return model, metrics


if __name__ == "__main__":
    trained_model, trained_metrics = train()
    save(trained_model, trained_metrics)
    print(json.dumps(trained_metrics, indent=2))
    sys.exit(0)
