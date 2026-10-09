// Reference relative-risk formula. The Python ML service is trained on data
// generated from the SAME formula (see ml-service/risk_formula.py), and this
// JavaScript copy is the fallback used if the ML service is unreachable.
//
// This is a relative impact INDEX built from documented assumptions. It is not
// a measurement or a prediction of real water chemistry.

// ---- Tuneable constants (keep in sync with ml-service/risk_formula.py) ----
export const MATERIAL_FACTOR = { CLAY: 0.25, PLASTER_OF_PARIS: 1.0, UNKNOWN: 1.0 };
export const WATER_VULNERABILITY = { NATURAL_LAKE: 1.0, ARTIFICIAL_POND: 0.3, HOME_CONTAINER: 0.05 };
export const FLOWER_LOAD_PER_KG = 0.5;
export const SCORE_SCALE = 1500;
export const LOW_MAX = 33;
export const MEDIUM_MAX = 66;
export const DEFAULT_BOD_MGL = 6.0;
export const DEFAULT_DO_MGL = 4.5;
// ---------------------------------------------------------------------------

const clip = (value, min, max) => Math.min(max, Math.max(min, value));

export const levelFor = (score) => (score < LOW_MAX ? 'LOW' : score < MEDIUM_MAX ? 'MEDIUM' : 'HIGH');

export function baselineStress(bod, dissolvedOxygen) {
  const bodTerm = clip((bod - 3) / (30 - 3), 0, 1);
  const doTerm = clip((5 - dissolvedOxygen) / 5, 0, 1);
  return 0.5 * bodTerm + 0.5 * doTerm;
}

export function formulaScore(input) {
  const material = MATERIAL_FACTOR[input.material] ?? MATERIAL_FACTOR.UNKNOWN;
  const vulnerability = WATER_VULNERABILITY[input.waterBodyType] ?? WATER_VULNERABILITY.NATURAL_LAKE;
  const idolLoad = input.idolCount * material * input.heightFt ** 2;
  const flowerLoad = FLOWER_LOAD_PER_KG * input.flowerKg;
  const stress = baselineStress(input.baselineBodMgL, input.baselineDoMgL);
  const raw = (idolLoad + flowerLoad) * vulnerability * (1 + stress);
  return Number((100 * (1 - Math.exp(-raw / SCORE_SCALE))).toFixed(1));
}
