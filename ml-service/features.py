"""Feature encoding shared by training and serving."""
from __future__ import annotations

import pandas as pd

from risk_formula import DEFAULT_BOD_MGL, DEFAULT_DO_MGL

FEATURES = [
    "idol_count",
    "height_ft",
    "is_pop",
    "flower_kg",
    "is_natural",
    "is_home",
    "baseline_bod_mgl",
    "baseline_do_mgl",
]


def encode(
    idol_count: float,
    material: str,
    height_ft: float,
    flower_kg: float = 0.0,
    water_body_type: str = "NATURAL_LAKE",
    baseline_bod_mgl: float = DEFAULT_BOD_MGL,
    baseline_do_mgl: float = DEFAULT_DO_MGL,
) -> pd.DataFrame:
    """One-row feature frame. Unknown material is treated as plaster of Paris (precautionary)."""
    return pd.DataFrame(
        [
            {
                "idol_count": float(idol_count),
                "height_ft": float(height_ft),
                "is_pop": 0.0 if material == "CLAY" else 1.0,
                "flower_kg": float(flower_kg),
                "is_natural": 1.0 if water_body_type == "NATURAL_LAKE" else 0.0,
                "is_home": 1.0 if water_body_type == "HOME_CONTAINER" else 0.0,
                "baseline_bod_mgl": float(baseline_bod_mgl),
                "baseline_do_mgl": float(baseline_do_mgl),
            }
        ],
        columns=FEATURES,
    )
