from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

APP_DIR = Path(__file__).resolve().parent
MODEL_DIR = APP_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)
FEATURES = ["humedad", "temperatura", "hora", "dias_cultivo", "humedad_minima", "humedad_maxima", "salud_foliar"]

app = FastAPI(title="Frutas del Oasis IA", version="1.1.0")


class TrainingRow(BaseModel):
    humedad: float
    temperatura: float
    hora: int = Field(ge=0, le=23)
    dias_cultivo: float = 0
    humedad_minima: float
    humedad_maxima: float
    salud_foliar: float = Field(default=85, ge=0, le=100)
    decision: Literal["REGAR", "NO_REGAR"]


class TrainRequest(BaseModel):
    project_id: int
    rows: list[TrainingRow]


class PredictionRow(BaseModel):
    humedad: float
    temperatura: float
    hora: int = Field(ge=0, le=23)
    dias_cultivo: float = 0
    humedad_minima: float
    humedad_maxima: float
    salud_foliar: float = Field(default=85, ge=0, le=100)


class PredictRequest(BaseModel):
    model_path: str
    rows: list[PredictionRow]


def matrix(rows, features=FEATURES):
    return np.asarray([[getattr(row, name) for name in features] for row in rows], dtype=float)


@app.get("/health")
def health():
    models = list(MODEL_DIR.glob("*.joblib"))
    return {"status": "online", "service": "random-forest", "models": len(models), "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/train")
def train(request: TrainRequest):
    if len(request.rows) < 20:
        raise HTTPException(422, "Se necesitan al menos 20 muestras históricas.")
    labels = np.asarray([1 if row.decision == "REGAR" else 0 for row in request.rows])
    if len(np.unique(labels)) < 2:
        raise HTTPException(422, "El historial debe contener ejemplos de REGAR y NO_REGAR.")
    x_train, x_test, y_train, y_test = train_test_split(matrix(request.rows), labels, test_size=0.25, random_state=42, stratify=labels)
    model = RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_leaf=2, class_weight="balanced", random_state=42, n_jobs=-1)
    model.fit(x_train, y_train)
    predicted = model.predict(x_test)
    version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "-" + uuid4().hex[:6]
    path = MODEL_DIR / f"project-{request.project_id}-{version}.joblib"
    joblib.dump({"model": model, "features": FEATURES, "version": version}, path)
    report = classification_report(y_test, predicted, output_dict=True, zero_division=0)
    return {
        "version": version, "model_path": str(path), "algorithm": "RandomForestClassifier",
        "samples": len(request.rows), "accuracy": round(float(accuracy_score(y_test, predicted)), 4),
        "precision": round(float(report.get("1", {}).get("precision", 0)), 4),
        "recall": round(float(report.get("1", {}).get("recall", 0)), 4),
        "feature_importance": dict(zip(FEATURES, [round(float(value), 5) for value in model.feature_importances_])),
    }


@app.post("/predict")
def predict(request: PredictRequest):
    path = Path(request.model_path).resolve()
    if MODEL_DIR.resolve() not in path.parents or not path.exists():
        raise HTTPException(404, "El archivo del modelo no existe.")
    artifact = joblib.load(path)
    model = artifact["model"]
    artifact_features = artifact.get("features", FEATURES)
    probabilities = model.predict_proba(matrix(request.rows, artifact_features))
    return {"predictions": [
        {"decision": "REGAR" if int(np.argmax(item)) == 1 else "NO_REGAR", "confidence": round(float(max(item)), 4)}
        for item in probabilities
    ]}
