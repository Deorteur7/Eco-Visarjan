from fastapi.testclient import TestClient

from app import app


def payload(**overrides):
    base = {"idol_count": 100, "material": "PLASTER_OF_PARIS", "height_ft": 5, "flower_kg": 50}
    base.update(overrides)
    return base


def test_health_and_model_info():
    with TestClient(app) as client:
        assert client.get("/health").json()["modelLoaded"] is True
        info = client.get("/model-info").json()
        assert info["trainedOn"] == "SYNTHETIC"
        assert info["holdoutR2"] > 0.9


def test_levels_are_valid_and_scores_bounded():
    with TestClient(app) as client:
        body = client.post("/predict", json=payload()).json()
        assert body["level"] in {"LOW", "MEDIUM", "HIGH"}
        assert 0 <= body["score"] <= 100


def test_clay_in_artificial_pond_is_lower_risk_than_pop_in_natural_lake():
    with TestClient(app) as client:
        bad = client.post("/predict", json=payload(water_body_type="NATURAL_LAKE")).json()["score"]
        good = client.post("/predict", json=payload(material="CLAY", water_body_type="ARTIFICIAL_POND")).json()["score"]
        assert good < bad


def test_more_idols_means_higher_score():
    with TestClient(app) as client:
        few = client.post("/predict", json=payload(idol_count=5)).json()["score"]
        many = client.post("/predict", json=payload(idol_count=500)).json()["score"]
        assert many > few


def test_validation_rejects_bad_input():
    with TestClient(app) as client:
        assert client.post("/predict", json=payload(material="MARBLE")).status_code == 422
        assert client.post("/predict", json=payload(height_ft=-1)).status_code == 422
