"""Reference relative-risk formula used to build the SYNTHETIC training data.

This is an *index* built from documented assumptions. It is not a measurement and
does not predict real water chemistry. Keep constants in sync with
server/src/services/pollutionFormula.js (the Node fallback).
"""
from __future__ import annotations

import numpy as np

# ---- Tuneable constants -----------------------------------------------------
MATERIAL_FACTOR = {"CLAY": 0.25, "PLASTER_OF_PARIS": 1.0, "UNKNOWN": 1.0}
WATER_VULNERABILITY = {"NATURAL_LAKE": 1.0, "ARTIFICIAL_POND": 0.3, "HOME_CONTAINER": 0.05}
FLOWER_LOAD_PER_KG = 0.5
SCORE_SCALE = 1500.0
LOW_MAX = 33.0
MEDIUM_MAX = 66.0
DEFAULT_BOD_MGL = 6.0
DEFAULT_DO_MGL = 4.5
# CPCB primary water-quality criteria use BOD <= 3 mg/L and DO >= 4-5 mg/L for the
# classes closest to human contact. Stress rises as BOD exceeds 3 (to 30 mg/L, a
# heavily polluted level) and as DO falls below 5 mg/L.
BOD_REFERENCE = 3.0
BOD_HEAVY = 30.0
DO_REFERENCE = 5.0
# -----------------------------------------------------------------------------


def baseline_stress(bod, dissolved_oxygen):
    bod_term = np.clip((bod - BOD_REFERENCE) / (BOD_HEAVY - BOD_REFERENCE), 0, 1)
    do_term = np.clip((DO_REFERENCE - dissolved_oxygen) / DO_REFERENCE, 0, 1)
    return 0.5 * bod_term + 0.5 * do_term


def raw_load(idol_count, height_ft, material_factor, flower_kg, vulnerability, stress):
    idol_load = idol_count * material_factor * np.power(height_ft, 2)
    flower_load = FLOWER_LOAD_PER_KG * flower_kg
    return (idol_load + flower_load) * vulnerability * (1.0 + stress)


def score_from_raw(raw):
    return 100.0 * (1.0 - np.exp(-raw / SCORE_SCALE))


def level_for(score: float) -> str:
    if score < LOW_MAX:
        return "LOW"
    if score < MEDIUM_MAX:
        return "MEDIUM"
    return "HIGH"
