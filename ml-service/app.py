"""FastAPI service exposing the pollution-risk model.

Endpoints:  GET /health   GET /model-info   POST /predict
Output is a relative risk INDEX (0-100) and LOW / MEDIUM / HIGH level. It is an
estimate from a model trained on SYNTHETIC data, not measured water quality.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Literal

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

from features import encode
from risk_formula import DEFAULT_BOD_MGL, DEFAULT_DO_MGL, level_for
from train import ensure_model

Material = Literal["CLAY", "PLASTER_OF_PARIS", "UNKNOWN"]
WaterBodyType = Literal["NATURAL_LAKE", "ARTIFICIAL_POND", "HOME_CONTAINER"]

state: dict = {}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    model, metrics = ensure_model()
    state["model"] = model
    state["metrics"] = metrics
    yield
    state.clear()


app = FastAPI(title="EcoVisarjan pollution-risk service", version="1.0.0", lifespan=lifespan)


class PredictRequest(BaseModel):
    idol_count: int = Field(ge=0, le=5000)
    material: Material
    height_ft: float = Field(ge=0.5, le=80)
    flower_kg: float = Field(default=0.0, ge=0, le=5000)
    water_body_type: WaterBodyType = "NATURAL_LAKE"
    baseline_bod_mgl: float = Field(default=DEFAULT_BOD_MGL, ge=0, le=200)
    baseline_do_mgl: float = Field(default=DEFAULT_DO_MGL, ge=0, le=20)


def _score(request: PredictRequest, **overrides) -> float:
    values = request.model_dump()
    values.update(overrides)
    frame = encode(
        values["idol_count"],
        values["material"],
        values["height_ft"],
        values["flower_kg"],
        values["water_body_type"],
        values["baseline_bod_mgl"],
        values["baseline_do_mgl"],
    )
    return float(np.clip(state["model"].predict(frame)[0], 0.0, 100.0))


def _model_info() -> dict:
    metrics = state["metrics"]
    return {
        "name": metrics["model"],
        "trainedOn": metrics["trainedOn"],
        "nSamples": metrics["nSamples"],
        "holdoutR2": metrics["holdout"]["r2"],
        "holdoutMae": metrics["holdout"]["mae"],
        "note": metrics["note"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "modelLoaded": "model" in state}


@app.get("/model-info")
def model_info():
    return {**_model_info(), "featureImportances": state["metrics"]["featureImportances"]}


@app.post("/predict")
def predict(request: PredictRequest):
    score = round(_score(request), 1)

    # What-if analysis: how much lower would the score be if each factor were removed?
    what_if = []
    scenarios = [
        ("Idol load", "Removing all idols", {"idol_count": 0}),
        ("Flower and decoration waste", "Removing all flower waste", {"flower_kg": 0.0}),
        ("Water body type", "Using a contained artificial pond instead", {"water_body_type": "ARTIFICIAL_POND"}),
        ("Idol material", "Using natural clay instead", {"material": "CLAY"}),
    ]
    for factor, description, override in scenarios:
        if all(getattr(request, key) == value for key, value in override.items()):
            continue
        alternative = round(_score(request, **override), 1)
        what_if.append(
            {
                "factor": factor,
                "scenario": description,
                "scoreWithChange": alternative,
                "pointsReduced": round(max(0.0, score - alternative), 1),
            }
        )
    what_if.sort(key=lambda item: item["pointsReduced"], reverse=True)

    return {
        "score": score,
        "level": level_for(score),
        "what_if": what_if,
        "model_info": _model_info(),
    }
