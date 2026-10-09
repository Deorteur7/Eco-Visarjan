"""Generates the SYNTHETIC training data. Nothing here is measured or government data.

Scenario ranges are chosen to be plausible for Hyderabad-scale immersion events:
  * idol counts from a single household idol to a large community immersion
  * heights from table-top idols to very tall community idols
  * baseline BOD / DO drawn around illustrative urban-lake values
Targets come from risk_formula.py plus multiplicative noise so the model must
generalise rather than memorise a closed-form expression.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

import risk_formula as rf

# ---- Tuneable constants -----------------------------------------------------
N_SAMPLES = 20000
SEED = 42
NOISE_SIGMA = 0.10  # log-normal multiplicative noise on the raw load
SMALL_SCENARIO_SHARE = 0.4  # share of household-scale scenarios (1-10 idols)
MAX_IDOL_COUNT = 2000
# -----------------------------------------------------------------------------


def generate(n_samples: int = N_SAMPLES, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    small = rng.random(n_samples) < SMALL_SCENARIO_SHARE
    idol_count = np.where(
        small,
        rng.integers(1, 11, n_samples),
        np.floor(np.exp(rng.uniform(np.log(5), np.log(MAX_IDOL_COUNT), n_samples))),
    ).astype(float)

    height_ft = np.clip(np.exp(rng.normal(np.log(3.0), 0.7, n_samples)), 0.5, 40.0)
    is_pop = (rng.random(n_samples) < 0.6).astype(float)
    material_factor = np.where(is_pop == 1.0, rf.MATERIAL_FACTOR["PLASTER_OF_PARIS"], rf.MATERIAL_FACTOR["CLAY"])

    flower_per_idol = rng.uniform(0.2, 3.0, n_samples)
    has_flowers = rng.random(n_samples) < 0.8
    flower_kg = np.where(has_flowers, idol_count * flower_per_idol, 0.0)

    water_type = rng.choice(["NATURAL_LAKE", "ARTIFICIAL_POND", "HOME_CONTAINER"], size=n_samples, p=[0.5, 0.35, 0.15])
    vulnerability = np.vectorize(rf.WATER_VULNERABILITY.get)(water_type)
    is_natural = (water_type == "NATURAL_LAKE").astype(float)
    is_home = (water_type == "HOME_CONTAINER").astype(float)

    bod = np.clip(rng.lognormal(mean=np.log(6.0), sigma=0.6, size=n_samples), 1.0, 60.0)
    dissolved_oxygen = np.clip(rng.normal(4.5, 1.8, n_samples), 0.2, 9.0)

    stress = rf.baseline_stress(bod, dissolved_oxygen)
    raw = rf.raw_load(idol_count, height_ft, material_factor, flower_kg, vulnerability, stress)
    raw = raw * rng.lognormal(mean=0.0, sigma=NOISE_SIGMA, size=n_samples)
    score = np.clip(rf.score_from_raw(raw), 0.0, 100.0)

    return pd.DataFrame(
        {
            "idol_count": idol_count,
            "height_ft": height_ft,
            "is_pop": is_pop,
            "flower_kg": flower_kg,
            "is_natural": is_natural,
            "is_home": is_home,
            "baseline_bod_mgl": bod,
            "baseline_do_mgl": dissolved_oxygen,
            "risk_score": score,
            "data_source": "SYNTHETIC",
        }
    )
