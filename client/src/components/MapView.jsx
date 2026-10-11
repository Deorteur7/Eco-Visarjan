import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ZOOM, HYDERABAD_CENTER } from '../lib/constants.js';
import { formatDistance, formatDuration } from '../lib/format.js';
import { FlowerPin, ImmersionPin, PIN_COLORS, TravelDot, UserDot, WaterDot } from './Pins.jsx';
import {
  Map as MapCanvas,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
  RouteMarker,
  RouteProgress,
  useMap,
} from './ui/map';

// ---- Tuneable constants -----------------------------------------------------
// Basemap: OpenFreeMap "positron" (free, OpenStreetMap data, no API key).
// Override with VITE_MAP_STYLE_URL in client/.env to use any MapLibre style.
const MAP_STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
// Used automatically if the vector style cannot be loaded.
const FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};
const STYLE_TIMEOUT_MS = 8000;
const PREVIEW_DURATION_MS = 3500; // length of the animated route preview
const FIT_PADDING = 60;
// -----------------------------------------------------------------------------

const CENTER = [HYDERABAD_CENTER[1], HYDERABAD_CENTER[0]]; // MapLibre uses [longitude, latitude]
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Moves the camera: to the user once, to a selected site, or to fit the whole route. */
function MapController({ user, selected, routeCoords, isRoute, onStyleFailed }) {
  const { map, isLoaded } = useMap();
  const centeredOnUser = useRef(false);
  const loadedRef = useRef(false);
  loadedRef.current = isLoaded;

  // If the basemap style cannot load, tell the parent so it can switch to the fallback.
  useEffect(() => {
    if (!map) return undefined;
    const onError = () => {
      if (!loadedRef.current) onStyleFailed();
    };
    map.on('error', onError);
    const timer = setTimeout(() => {
      if (!loadedRef.current) onStyleFailed();
    }, STYLE_TIMEOUT_MS);
    return () => {
      map.off('error', onError);
      clearTimeout(timer);
    };
  }, [map, onStyleFailed]);

  const userLat = user?.lat;
  const userLng = user?.lng;
  useEffect(() => {
    if (map && userLat != null && userLng != null && !centeredOnUser.current) {
      centeredOnUser.current = true;
      map.flyTo({ center: [userLng, userLat], zoom: 12, duration: 800 });
    }
  }, [map, userLat, userLng]);

  const selLat = selected?.latitude;
  const selLng = selected?.longitude;
  useEffect(() => {
    if (map && selLat != null && selLng != null && !isRoute) {
      map.flyTo({ center: [selLng, selLat], zoom: Math.max(map.getZoom(), 13), duration: 600 });
    }
  }, [map, selLat, selLng, isRoute]);

  useEffect(() => {
    if (!map || routeCoords.length < 2) return;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of routeCoords) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    map.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: FIT_PADDING, maxZoom: 15, duration: 1000 },
    );
  }, [map, routeCoords]);

  return null;
}

/** Draws the route and animates a dot travelling from the start to the destination. */
function RoutePreview({ coordinates, replayKey }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setProgress(1);
      return undefined;
    }
    let frame;
    let start;
    setProgress(0);
    const step = (now) => {
      start ??= now;
      const t = Math.min(1, (now - start) / PREVIEW_DURATION_MS);
      setProgress(easeInOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [coordinates, replayKey]);

  return (
    <>
      {/* white casing so the line stands out on any basemap */}
      <MapRoute coordinates={coordinates} color="#ffffff" width={9} opacity={0.95} interactive={false} />
      {/* full path in light orange, with the travelled part drawn in red on top */}
      <MapRoute coordinates={coordinates} color="#f5a45a" width={5} opacity={0.95} progress={progress} interactive={false}>
        <RouteProgress color={PIN_COLORS.route} width={5} opacity={1} />
        {progress < 1 && (
          <RouteMarker at="progress">
            <MarkerContent>
              <TravelDot />
            </MarkerContent>
          </RouteMarker>
        )}
      </MapRoute>
    </>
  );
}

export default function MapView({
  immersion = [],
  flower = [],
  waterBodies = [],
  layers,
  user,
  selected,
  route,
  onSelect,
  onLocate,
}) {
  const [styleFailed, setStyleFailed] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  // Server geometry is [lat, lng]; MapLibre wants [lng, lat].
  const routeCoords = useMemo(
    () => (route?.geometry?.length > 1 ? route.geometry.map(([lat, lng]) => [lng, lat]) : []),
    [route],
  );
  const style = styleFailed ? FALLBACK_STYLE : MAP_STYLE_URL;
  const styles = useMemo(() => ({ light: style, dark: style }), [style]);
  const isSelected = (kind, id) => selected?.kind === kind && selected?.point?.id === id;
  const handleStyleFailed = useMemo(() => () => setStyleFailed(true), []);

  return (
    <div className="relative h-full w-full">
      <MapCanvas center={CENTER} zoom={DEFAULT_ZOOM} theme="light" styles={styles}>
        <MapController
          user={user}
          selected={selected?.point}
          routeCoords={routeCoords}
          isRoute={routeCoords.length > 1}
          onStyleFailed={handleStyleFailed}
        />

        {layers.water &&
          waterBodies.map((body) => (
            <MapMarker key={body.id} longitude={body.longitude} latitude={body.latitude} onClick={() => onSelect({ kind: 'water', point: body })}>
              <MarkerContent>
                <WaterDot body={body} />
              </MarkerContent>
              <MarkerTooltip>{body.name} (sensitive water body)</MarkerTooltip>
            </MapMarker>
          ))}

        {immersion
          .filter((point) => (point.isArtificialPond ? layers.artificial : layers.immersion))
          .map((point) => (
            <MapMarker key={point.id} longitude={point.longitude} latitude={point.latitude} anchor="bottom" onClick={() => onSelect({ kind: 'immersion', point })}>
              <MarkerContent>
                <ImmersionPin point={point} selected={isSelected('immersion', point.id)} />
              </MarkerContent>
              <MarkerTooltip offset={[0, -34]}>{point.name}</MarkerTooltip>
            </MapMarker>
          ))}

        {layers.flower &&
          flower.map((point) => (
            <MapMarker key={point.id} longitude={point.longitude} latitude={point.latitude} anchor="bottom" onClick={() => onSelect({ kind: 'flower', point })}>
              <MarkerContent>
                <FlowerPin point={point} selected={isSelected('flower', point.id)} />
              </MarkerContent>
              <MarkerTooltip offset={[0, -34]}>{point.name}</MarkerTooltip>
            </MapMarker>
          ))}

        {routeCoords.length > 1 && <RoutePreview coordinates={routeCoords} replayKey={replayKey} />}

        {user && layers.user && (
          <MapMarker longitude={user.lng} latitude={user.lat}>
            <MarkerContent>
              <UserDot />
            </MarkerContent>
            <MarkerTooltip>Your starting point</MarkerTooltip>
          </MapMarker>
        )}

        <MapControls
          position="top-right"
          showZoom
          showCompass
          showFullscreen
          showLocate
          onLocate={({ latitude, longitude }) => onLocate?.({ lat: latitude, lng: longitude })}
        />
      </MapCanvas>

      {routeCoords.length > 1 && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap items-center gap-2">
          <div className="pointer-events-auto rounded-md border border-line bg-white/95 px-2.5 py-1.5 text-sm shadow-sm">
            <span className="font-semibold">{formatDistance(route.distanceKm)}</span>
            <span className="text-muted"> &middot; </span>
            <span className="font-semibold">{formatDuration(route.durationMin)}</span>
            {route.approximate && <span className="text-muted"> (straight line)</span>}
          </div>
          <button type="button" className="btn btn-secondary btn-small pointer-events-auto bg-white" onClick={() => setReplayKey((key) => key + 1)}>
            Replay preview
          </button>
        </div>
      )}
    </div>
  );
}
