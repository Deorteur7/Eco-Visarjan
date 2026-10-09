// Routing service: wraps OpenRouteService (if a key is set) or the public OSRM
// demo server. Falls back to a labelled straight-line estimate if both fail.
import { config } from '../config/index.js';
import { haversineKm, round } from '../utils/geo.js';

// ---- Tuneable constants ----------------------------------------------------
const FALLBACK_DETOUR_FACTOR = 1.3;
const FALLBACK_SPEED_KMH = 20; // slow, to reflect festival-day traffic
// -----------------------------------------------------------------------------

const toLatLng = ([lng, lat]) => [lat, lng];

async function viaOrs(from, to) {
  const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: config.routing.orsApiKey },
    body: JSON.stringify({ coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }),
    signal: AbortSignal.timeout(config.routing.timeoutMs),
  });
  if (!response.ok) throw new Error(`OpenRouteService responded ${response.status}`);
  const data = await response.json();
  const feature = data.features?.[0];
  const summary = feature?.properties?.summary;
  if (!feature || !summary) throw new Error('OpenRouteService returned no route');
  return {
    provider: 'OpenRouteService',
    distanceKm: round(summary.distance / 1000, 1),
    durationMin: Math.max(1, Math.round(summary.duration / 60)),
    geometry: feature.geometry.coordinates.map(toLatLng),
  };
}

async function viaOsrm(from, to) {
  const url =
    `${config.routing.osrmBaseUrl}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    '?overview=full&geometries=geojson&steps=false';
  const response = await fetch(url, { signal: AbortSignal.timeout(config.routing.timeoutMs) });
  if (!response.ok) throw new Error(`OSRM responded ${response.status}`);
  const data = await response.json();
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) throw new Error('OSRM returned no route');
  return {
    provider: 'OSRM (OpenStreetMap data)',
    distanceKm: round(route.distance / 1000, 1),
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    geometry: route.geometry.coordinates.map(toLatLng),
  };
}

function straightLineEstimate(from, to) {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng) * FALLBACK_DETOUR_FACTOR;
  return {
    provider: 'Straight-line estimate',
    distanceKm: round(km, 1),
    durationMin: Math.max(1, Math.round((km / FALLBACK_SPEED_KMH) * 60)),
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    approximate: true,
  };
}

export function navigationLinks(from, to) {
  return {
    openStreetMap: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.lat}%2C${from.lng}%3B${to.lat}%2C${to.lng}`,
    googleMaps: `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`,
  };
}

export async function getRoute(from, to) {
  const providers = config.routing.orsApiKey ? [viaOrs, viaOsrm] : [viaOsrm];
  let route;
  for (const provider of providers) {
    try {
      route = await provider(from, to);
      break;
    } catch {
      // try the next provider
    }
  }
  route ??= straightLineEstimate(from, to);

  return {
    ...route,
    approximate: route.approximate ?? false,
    navigation: navigationLinks(from, to),
    notice:
      'Travel time ignores festival traffic. Road closures and diversions are common on immersion days: follow traffic police advisories.',
  };
}
