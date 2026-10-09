// Location/data service: reads points from the data store, adds distances and filters.
import { getStore } from '../db/index.js';
import { haversineKm, round } from '../utils/geo.js';
import { evaluatePoint } from './suitability.js';
import { notFound } from '../utils/errors.js';
import { WATER_BODY_DISCLAIMER, waterBodies } from '../data/waterBodies.js';

const withDistance = (point, origin) => {
  if (!origin) return { ...point, distanceKm: null };
  return {
    ...point,
    distanceKm: round(haversineKm(origin.lat, origin.lng, point.latitude, point.longitude), 2),
  };
};

const sortByDistance = (items) =>
  [...items].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

export async function loadImmersionPoints() {
  return getStore().list('immersion');
}

export async function loadFlowerPoints() {
  return getStore().list('flower');
}

export async function listImmersionPoints(filters = {}) {
  const { lat, lng, material, heightFt, maxDistanceKm, includeDemo = true, onlySuitable = false, type } = filters;
  const origin = lat != null && lng != null ? { lat, lng } : null;

  let items = (await loadImmersionPoints()).map((point) => withDistance(point, origin));

  if (!includeDemo) items = items.filter((point) => point.verification !== 'DEMO_PLACEHOLDER');
  if (type) items = items.filter((point) => point.type === type);
  if (maxDistanceKm != null && origin) {
    items = items.filter((point) => point.distanceKm <= maxDistanceKm);
  }

  if (material || heightFt != null) {
    const idol = { material: material ?? 'UNKNOWN', heightFt: heightFt ?? 0 };
    items = items.map((point) => {
      const evaluation = evaluatePoint(point, idol, point.distanceKm ?? 0);
      return { ...point, suitability: { eligible: evaluation.eligible, exclusions: evaluation.exclusions } };
    });
    if (onlySuitable) items = items.filter((point) => point.suitability.eligible);
  }

  return origin ? sortByDistance(items) : items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listFlowerPoints(filters = {}) {
  const { lat, lng, maxDistanceKm, includeDemo = true } = filters;
  const origin = lat != null && lng != null ? { lat, lng } : null;

  let items = (await loadFlowerPoints()).map((point) => withDistance(point, origin));
  if (!includeDemo) items = items.filter((point) => point.verification !== 'DEMO_PLACEHOLDER');
  if (maxDistanceKm != null && origin) {
    items = items.filter((point) => point.distanceKm <= maxDistanceKm);
  }
  return origin ? sortByDistance(items) : items.sort((a, b) => a.name.localeCompare(b.name));
}

export function listWaterBodies() {
  return { items: waterBodies, disclaimer: WATER_BODY_DISCLAIMER };
}

export async function getDestination(kind, id) {
  const tableKey = kind === 'flower' ? 'flower' : 'immersion';
  const point = await getStore().get(tableKey, id);
  if (!point) throw notFound(`No ${kind} point with id "${id}"`);
  return point;
}
