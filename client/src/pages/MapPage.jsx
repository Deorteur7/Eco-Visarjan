import { useCallback, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import LocationCard from '../components/LocationCard.jsx';
import MapView from '../components/MapView.jsx';
import Recommendation from '../components/Recommendation.jsx';
import SiteDetail from '../components/SiteDetail.jsx';
import { PIN_COLORS } from '../components/Pins.jsx';
import { EmptyState, ErrorNotice, InfoNotice, Spinner, VerificationBadge } from '../components/ui.jsx';
import { useSession } from '../context/SessionContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { api } from '../lib/api.js';
import { DISTANCE_OPTIONS, MATERIALS } from '../lib/constants.js';
import { formatDistance } from '../lib/format.js';

const LAYER_DEFS = [
  { key: 'immersion', label: 'Immersion points (lakes and tanks)', color: PIN_COLORS.immersion },
  { key: 'artificial', label: 'Artificial and baby ponds', color: PIN_COLORS.artificial },
  { key: 'flower', label: 'Flower disposal points', color: PIN_COLORS.flower },
  { key: 'water', label: 'Sensitive water bodies', color: PIN_COLORS.water },
  { key: 'user', label: 'Your location', color: PIN_COLORS.user },
];

export default function MapPage() {
  const { idol, location, setLocation } = useSession();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'flower' ? 'flower' : 'immersion');
  const [layers, setLayers] = useState({ immersion: true, artificial: true, flower: true, water: true, user: true });
  const [material, setMaterial] = useState(idol?.material ?? 'UNKNOWN');
  const [heightFt, setHeightFt] = useState(idol?.heightFt ? String(idol.heightFt) : '3');
  const [maxDistance, setMaxDistance] = useState('');
  const [onlySuitable, setOnlySuitable] = useState(true);
  const [selected, setSelected] = useState(null);
  const [route, setRoute] = useState(null);

  const height = Number(heightFt);
  const heightValid = heightFt !== '' && height >= 0.5 && height <= 80;
  const lat = location?.lat;
  const lng = location?.lng;

  const immersion = useAsync(
    (signal) =>
      api.immersionPoints(
        { lat, lng, material, heightFt: heightValid ? height : undefined, maxDistanceKm: lat != null ? maxDistance : undefined, onlySuitable },
        signal,
      ),
    [lat, lng, material, heightFt, maxDistance, onlySuitable],
  );
  const flower = useAsync(
    (signal) => api.flowerPoints({ lat, lng, maxDistanceKm: lat != null ? maxDistance : undefined }, signal),
    [lat, lng, maxDistance],
  );
  const water = useAsync((signal) => api.waterBodies(signal), []);
  const recommendation = useAsync(
    (signal) => (lat != null && heightValid ? api.recommend({ lat, lng, material, heightFt: height }, signal) : Promise.resolve(null)),
    [lat, lng, material, heightFt],
  );

  const immersionItems = immersion.data?.items ?? [];
  const flowerItems = flower.data?.items ?? [];
  const recommendedId = recommendation.data?.recommended?.id;

  const select = useCallback((value) => {
    setSelected(value);
    if (value?.kind === 'flower') setTab('flower');
    else if (value?.kind === 'immersion') setTab('immersion');
  }, []);
  const mapBoxRef = useRef(null);
  const onRoute = useCallback((value) => {
    setRoute(value);
    // On a phone the map sits above the details, so bring it into view to show the path.
    if (value && window.matchMedia('(max-width: 1023px)').matches) {
      mapBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const toggle = (key) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const listError = immersion.error || flower.error;

  const showRecommendation = tab === 'immersion' && !selected;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl">Pollution-safe map</h1>
          <p className="text-muted">Find a suitable immersion site or a flower drop-off, then get directions.</p>
        </div>
        {!idol && (
          <Link to="/check" className="btn btn-secondary btn-small">Check my idol first</Link>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div ref={mapBoxRef} className="h-[52dvh] min-h-80 scroll-mt-4 overflow-hidden sm:scroll-mt-24 rounded-xl border border-line lg:h-[calc(100dvh-17rem)]">
            <MapView
              immersion={immersionItems}
              flower={flowerItems}
              waterBodies={water.data?.items ?? []}
              layers={layers}
              user={location}
              selected={selected}
              route={route}
              onSelect={select}
              onLocate={(position) => setLocation({ ...position, source: 'GPS', label: 'Your location' })}
            />
          </div>
          <fieldset className="card">
            <legend className="px-1 text-sm font-semibold">Map layers</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {LAYER_DEFS.map((layer) => (
                <label key={layer.key} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-kumkum" checked={layers[layer.key]} onChange={() => toggle(layer.key)} />
                  <span className="inline-block h-3 w-3 rounded-full border border-white shadow" style={{ background: layer.color }} aria-hidden="true" />
                  {layer.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="space-y-4" aria-label="Sites and filters">
          <div className="card">
            <LocationCard compact={Boolean(location)} />
          </div>

          <div className="card space-y-3">
            <h2 className="text-base">Filters</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="f-material">Idol material</label>
                <select id="f-material" className="input" value={material} onChange={(event) => setMaterial(event.target.value)}>
                  {MATERIALS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="f-height">Height (ft)</label>
                <input id="f-height" className="input" type="number" min="0.5" max="80" step="0.1" value={heightFt} onChange={(event) => setHeightFt(event.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="f-distance">Distance</label>
              <select id="f-distance" className="input" value={maxDistance} onChange={(event) => setMaxDistance(event.target.value)} disabled={!location}>
                {DISTANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {!location && <p className="mt-1 text-xs text-muted">Set your starting point to filter by distance.</p>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-kumkum" checked={onlySuitable} onChange={(event) => setOnlySuitable(event.target.checked)} />
              Hide sites that cannot take this idol
            </label>
            {!heightValid && <p className="text-sm text-kumkum">Enter a height between 0.5 and 80 feet.</p>}
          </div>

          <div role="tablist" aria-label="Site type" className="grid grid-cols-2 gap-1 rounded-lg bg-white p-1 border border-line">
            {[['immersion', 'Immersion sites'], ['flower', 'Flower disposal']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`btn btn-small ${tab === key ? 'btn-dark' : 'bg-white text-ink hover:bg-cream'}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {listError && <ErrorNotice title="Could not load sites">{listError.message}</ErrorNotice>}

          {selected && <SiteDetail selected={selected} location={location} idol={idol} onRoute={onRoute} onClose={() => { setSelected(null); setRoute(null); }} />}

          {showRecommendation && (
            <>
              {!location && <InfoNotice title="Set your starting point">The best-site ranking needs your location. Use the card above.</InfoNotice>}
              {recommendation.loading && location && <Spinner label="Ranking sites" />}
              {recommendation.error && <ErrorNotice>{recommendation.error.message}</ErrorNotice>}
              {recommendation.data && <Recommendation data={recommendation.data} onSelect={select} />}
            </>
          )}

          {tab === 'immersion' && (
            <section aria-labelledby="list-imm" className="space-y-2">
              <h2 id="list-imm" className="text-base">All matching immersion sites ({immersionItems.length})</h2>
              {immersion.loading && !immersion.data && <Spinner label="Loading sites" />}
              {!immersion.loading && immersionItems.length === 0 && (
                <EmptyState title="No sites match these filters">Try a larger distance or untick &quot;Hide sites that cannot take this idol&quot;.</EmptyState>
              )}
              <ul className="space-y-2">
                {immersionItems.map((point) => (
                  <li key={point.id}>
                    <button type="button" onClick={() => select({ kind: 'immersion', point })} className={`card w-full text-left hover:border-kumkum ${selected?.point?.id === point.id ? 'border-kumkum' : ''}`}>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{point.name}</span>
                        {point.id === recommendedId && <span className="badge badge-red">Recommended</span>}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span>{point.isArtificialPond ? 'Artificial pond' : 'Natural lake or tank'}</span>
                        {point.distanceKm != null && <span>&middot; {formatDistance(point.distanceKm)}</span>}
                      </span>
                      <span className="mt-1 block"><VerificationBadge verification={point.verification} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === 'flower' && (
            <section aria-labelledby="list-flower" className="space-y-2">
              <h2 id="list-flower" className="text-base">Flower and organic-waste drop-offs ({flowerItems.length})</h2>
              <InfoNotice tone="green">Do not throw flowers, leaves or decorations into lakes. They decay in the water, use up oxygen and add to organic waste.</InfoNotice>
              {flower.loading && !flower.data && <Spinner label="Loading drop-offs" />}
              {!flower.loading && flowerItems.length === 0 && <EmptyState title="No drop-off points found">Try a larger distance.</EmptyState>}
              <ul className="space-y-2">
                {flowerItems.map((point) => (
                  <li key={point.id}>
                    <button type="button" onClick={() => select({ kind: 'flower', point })} className={`card w-full text-left hover:border-leaf ${selected?.point?.id === point.id ? 'border-leaf' : ''}`}>
                      <span className="font-semibold">{point.name}</span>
                      <span className="mt-1 block text-sm text-muted">{point.area}{point.distanceKm != null && ` · ${formatDistance(point.distanceKm)}`}</span>
                      <span className="mt-1 block"><VerificationBadge verification={point.verification} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
