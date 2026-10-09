import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { MATERIAL_LABEL } from '../lib/constants.js';
import { formatDistance, formatDuration } from '../lib/format.js';
import { ErrorNotice, InfoNotice, Spinner, VerificationBadge } from './ui.jsx';

/** Details, directions and "I'm going here" logging for a selected immersion or flower point. */
export default function SiteDetail({ selected, location, idol, onRoute, onClose }) {
  const { kind, point } = selected;
  const [route, setRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [routing, setRouting] = useState(false);
  const [quantity, setQuantity] = useState(kind === 'flower' ? '2' : '1');
  const [logState, setLogState] = useState('idle');

  // Reset everything when a different point is selected.
  useEffect(() => {
    setRoute(null);
    setRouteError(null);
    setLogState('idle');
    setQuantity(kind === 'flower' ? '2' : '1');
    onRoute(null);
  }, [point.id, kind, onRoute]);

  async function getDirections() {
    if (!location) return;
    setRouting(true);
    setRouteError(null);
    try {
      const result = await api.route({ fromLat: location.lat, fromLng: location.lng, toLat: point.latitude, toLng: point.longitude });
      setRoute(result);
      onRoute(result);
    } catch (err) {
      setRouteError(err.message);
    } finally {
      setRouting(false);
    }
  }

  async function log() {
    setLogState('saving');
    try {
      if (kind === 'flower') {
        await api.recordActivity({ type: 'FLOWER_DISPOSAL', destinationId: point.id, flowerKg: Number(quantity) });
      } else {
        await api.recordActivity({
          type: 'DESIGNATED_GUIDED',
          destinationId: point.id,
          idolCount: Number(quantity),
          material: idol.material,
          heightFt: idol.heightFt,
        });
      }
      setLogState('saved');
    } catch (err) {
      setLogState(err.message ?? 'error');
    }
  }

  const canLog = kind === 'flower' || Boolean(idol?.material && idol?.heightFt);
  const quantityValid = Number(quantity) > 0;

  if (kind === 'water') {
    return (
      <div className="card space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg">{point.name}</h3>
          <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
        </div>
        <span className="badge badge-water">Sensitive water body</span>
        <p className="text-sm">{point.note}</p>
        <p className="text-xs text-muted">Informational layer only. Not an official protected-area boundary. Map position is approximate.</p>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg">{point.name}</h3>
          <p className="text-sm text-muted">{point.area}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <VerificationBadge verification={point.verification} />
        {kind === 'immersion' && (
          <span className={`badge ${point.isArtificialPond ? 'badge-orange' : 'badge-red'}`}>
            {point.isArtificialPond ? 'Artificial pond' : 'Natural lake or tank'}
          </span>
        )}
        {kind === 'flower' && <span className="badge badge-green">Flower and organic waste</span>}
        {point.distanceKm != null && <span className="badge badge-neutral">{formatDistance(point.distanceKm)} straight line</span>}
      </div>

      {kind === 'immersion' && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted">Maximum idol size</dt>
            <dd className="font-semibold">{point.maxIdolSizeFt != null ? `${point.maxIdolSizeFt} ft` : 'Not published'}</dd>
          </div>
          <div>
            <dt className="text-muted">Accepted materials</dt>
            <dd className="font-semibold">
              {Array.isArray(point.allowedMaterials) ? point.allowedMaterials.map((m) => MATERIAL_LABEL[m]).join(', ') : 'Not published'}
            </dd>
          </div>
        </dl>
      )}

      {point.statusNote && <p className="text-sm text-muted">{point.statusNote}</p>}
      {point.coordinateAccuracy === 'APPROXIMATE' && (
        <InfoNotice tone="orange">Map position is approximate. Follow on-site signage and official instructions.</InfoNotice>
      )}
      <p className="text-xs text-muted">
        Source: {point.source}{' '}
        {point.sourceUrl && <a href={point.sourceUrl} target="_blank" rel="noopener noreferrer">Link</a>}
      </p>

      {kind === 'flower' && (
        <InfoNotice tone="green">Flowers, leaves and decorations should not be thrown into lakes. They rot, use up oxygen and add to organic waste in the water.</InfoNotice>
      )}

      <div className="space-y-2 border-t border-line pt-3">
        {!location && <p className="text-sm text-muted">Set your starting point to get directions.</p>}
        <button type="button" className="btn btn-primary w-full" onClick={getDirections} disabled={!location || routing}>
          Get directions
        </button>
        {routing && <Spinner label="Finding the route" />}
        {routeError && <ErrorNotice>{routeError}</ErrorNotice>}

        {route && (
          <div className="space-y-2 rounded-lg bg-cream p-3 text-sm" aria-live="polite">
            <p>
              <span className="font-serif text-2xl font-bold">{formatDistance(route.distanceKm)}</span>
              <span className="mx-2 text-muted">about</span>
              <span className="font-serif text-2xl font-bold">{formatDuration(route.durationMin)}</span>
            </p>
            <p className="text-xs text-muted">
              {route.approximate ? 'Rough straight-line estimate because routing was unavailable.' : `Route from ${route.provider}.`} {route.notice}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <a className="btn btn-dark btn-small" href={route.navigation.googleMaps} target="_blank" rel="noopener noreferrer">Start navigation</a>
              <a className="btn btn-secondary btn-small" href={route.navigation.openStreetMap} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap</a>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <p className="text-sm font-semibold">{kind === 'flower' ? 'Record a flower drop-off' : 'Record that you are going here'}</p>
        {!canLog && <p className="text-sm text-muted">Check your idol first so we can record this accurately.</p>}
        {canLog && logState !== 'saved' && (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="field-label" htmlFor="quantity">{kind === 'flower' ? 'Flower waste (kg)' : 'Number of idols'}</label>
              <input
                id="quantity"
                className="input !w-32"
                type="number"
                min={kind === 'flower' ? '0.1' : '1'}
                step={kind === 'flower' ? '0.1' : '1'}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={log} disabled={!quantityValid || logState === 'saving'}>
              Count it
            </button>
          </div>
        )}
        {logState === 'saved' && <p className="text-sm font-semibold text-leaf">Recorded. It now counts on the impact page.</p>}
        {logState !== 'idle' && logState !== 'saving' && logState !== 'saved' && <p className="text-sm text-kumkum">{logState}</p>}
      </div>
    </div>
  );
}
