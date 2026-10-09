// Pure scoring logic for ranking immersion points. No I/O, easy to unit test.
//
// The ranking is a transparent weighted score, NOT a learned model. Every factor
// is returned in `breakdown` so the UI can explain why a location was chosen.

// ---- Tuneable constants ----------------------------------------------------
export const WEIGHTS = {
  distance: 0.35,
  facility: 0.25,
  sizeFit: 0.15,
  material: 0.15,
  status: 0.1,
};
export const DISTANCE_SCALE_KM = 8; // distance score = 1 / (1 + roadKm / scale)
export const DETOUR_FACTOR = 1.3; // straight-line km -> rough road km
export const DEMO_PENALTY = 0.85; // placeholder data is ranked below real data
export const UNKNOWN_FIELD_SCORE = 0.6; // neutral score when a source does not publish a field
// Facility suitability by idol material. Plaster of Paris (and unknown material,
// treated precautionarily) should go to a contained artificial pond when possible.
export const FACILITY_SCORE = {
  PLASTER_OF_PARIS: { artificial: 1, natural: 0.15 },
  UNKNOWN: { artificial: 1, natural: 0.15 },
  CLAY: { artificial: 1, natural: 0.5 },
};
// -----------------------------------------------------------------------------

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * Evaluates one immersion point for one idol.
 * @param point   immersion point record
 * @param idol    { material, heightFt }
 * @param distanceKm straight-line distance from the user
 */
export function evaluatePoint(point, idol, distanceKm) {
  const exclusions = [];
  const warnings = [];
  const reasons = [];

  if (point.isActive === false) exclusions.push('Marked inactive');

  if (point.maxIdolSizeFt != null && idol.heightFt > point.maxIdolSizeFt) {
    exclusions.push(`Idol is taller than this site's ${point.maxIdolSizeFt} ft limit`);
  }
  if (
    Array.isArray(point.allowedMaterials) &&
    idol.material !== 'UNKNOWN' &&
    !point.allowedMaterials.includes(idol.material)
  ) {
    exclusions.push('Material is not accepted at this site');
  }

  const roadKm = distanceKm * DETOUR_FACTOR;
  const distance = 1 / (1 + roadKm / DISTANCE_SCALE_KM);

  const facilityTable = FACILITY_SCORE[idol.material] ?? FACILITY_SCORE.UNKNOWN;
  const facility = point.isArtificialPond ? facilityTable.artificial : facilityTable.natural;

  let sizeFit = UNKNOWN_FIELD_SCORE;
  if (point.maxIdolSizeFt != null) {
    sizeFit = idol.heightFt <= point.maxIdolSizeFt ? 1 : 0;
  } else {
    warnings.push('Idol-size limit not published. Confirm with officials on site.');
  }

  let material = UNKNOWN_FIELD_SCORE;
  if (Array.isArray(point.allowedMaterials)) {
    material = idol.material === 'UNKNOWN' || point.allowedMaterials.includes(idol.material) ? 1 : 0;
  } else {
    warnings.push('Accepted materials not published. Confirm with officials on site.');
  }

  let status = UNKNOWN_FIELD_SCORE;
  if (point.isActive === true) status = 1;
  if (point.isActive === false) status = 0;

  const breakdown = { distance, facility, sizeFit, material, status };
  let score = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + weight * clamp01(breakdown[key]),
    0,
  );

  if (point.verification === 'DEMO_PLACEHOLDER') {
    score *= DEMO_PENALTY;
    warnings.push('Demo placeholder, not a real facility.');
  }
  if (point.coordinateAccuracy === 'APPROXIMATE') {
    warnings.push('Map position is approximate. Follow on-site signage.');
  }

  if (point.isArtificialPond && idol.material !== 'CLAY') {
    reasons.push('Contained artificial pond, preferred for plaster of Paris idols');
  } else if (point.isArtificialPond) {
    reasons.push('Contained artificial pond keeps clay and decorations out of open water');
  }
  if (distanceKm <= 5) reasons.push(`About ${distanceKm.toFixed(1)} km away`);
  if (point.maxIdolSizeFt != null && idol.heightFt <= point.maxIdolSizeFt) {
    reasons.push(`Accepts idols up to ${point.maxIdolSizeFt} ft`);
  }

  return {
    eligible: exclusions.length === 0,
    exclusions,
    score: Number(score.toFixed(4)),
    breakdown: Object.fromEntries(
      Object.entries(breakdown).map(([key, value]) => [key, Number(clamp01(value).toFixed(3))]),
    ),
    reasons,
    warnings,
  };
}
