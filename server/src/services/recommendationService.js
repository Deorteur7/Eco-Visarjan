// Recommendation service: ranks immersion points for a specific idol and user location.
import { haversineKm, round } from '../utils/geo.js';
import { loadImmersionPoints } from './locationService.js';
import { evaluatePoint } from './suitability.js';

const MAX_RESULTS = 5;
const MAX_EXCLUDED_SHOWN = 4;

const summarise = (point, evaluation, distanceKm) => ({
  id: point.id,
  name: point.name,
  area: point.area,
  type: point.type,
  latitude: point.latitude,
  longitude: point.longitude,
  isArtificialPond: point.isArtificialPond,
  maxIdolSizeFt: point.maxIdolSizeFt,
  allowedMaterials: point.allowedMaterials,
  verification: point.verification,
  coordinateAccuracy: point.coordinateAccuracy,
  source: point.source,
  sourceUrl: point.sourceUrl,
  statusNote: point.statusNote,
  distanceKm: round(distanceKm, 2),
  score: evaluation.score,
  breakdown: evaluation.breakdown,
  reasons: evaluation.reasons,
  warnings: evaluation.warnings,
});

export async function recommend({ lat, lng, material, heightFt }) {
  const idol = { material, heightFt };
  const points = await loadImmersionPoints();

  const evaluated = points.map((point) => {
    const distanceKm = haversineKm(lat, lng, point.latitude, point.longitude);
    return { point, distanceKm, evaluation: evaluatePoint(point, idol, distanceKm) };
  });

  const eligible = evaluated
    .filter((entry) => entry.evaluation.eligible)
    .sort((a, b) => b.evaluation.score - a.evaluation.score);
  const excluded = evaluated
    .filter((entry) => !entry.evaluation.eligible)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const ranked = eligible
    .slice(0, MAX_RESULTS)
    .map((entry, index) => ({ rank: index + 1, ...summarise(entry.point, entry.evaluation, entry.distanceKm) }));

  const nearestOverall = [...evaluated].sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
  const recommended = ranked[0] ?? null;

  let explanation = 'No suitable immersion point was found for this idol. Please contact your municipal corporation.';
  if (recommended) {
    explanation = `${recommended.name} ranks first for a ${heightFt} ft ${materialLabel(material)} idol.`;
    if (nearestOverall && nearestOverall.point.id !== recommended.id) {
      const nearest = nearestOverall;
      if (!nearest.evaluation.eligible) {
        explanation += ` The nearest site, ${nearest.point.name}, was skipped: ${nearest.evaluation.exclusions.join('; ')}.`;
      } else {
        explanation += ` It was chosen over the nearest site, ${nearest.point.name}, because it scores better on facility type, size and material fit as well as distance.`;
      }
    }
  }

  return {
    recommended,
    alternatives: ranked.slice(1),
    excluded: excluded.slice(0, MAX_EXCLUDED_SHOWN).map((entry) => ({
      id: entry.point.id,
      name: entry.point.name,
      distanceKm: round(entry.distanceKm, 2),
      reasons: entry.evaluation.exclusions,
    })),
    nearestId: nearestOverall?.point.id ?? null,
    recommendedIsNearest: Boolean(recommended && nearestOverall?.point.id === recommended.id),
    explanation,
    method:
      'Weighted score of distance, facility type, idol-size fit, material fit and availability. Heuristic ranking, not a guarantee of acceptance.',
  };
}

function materialLabel(material) {
  if (material === 'PLASTER_OF_PARIS') return 'plaster of Paris';
  if (material === 'CLAY') return 'clay';
  return 'unverified-material';
}
