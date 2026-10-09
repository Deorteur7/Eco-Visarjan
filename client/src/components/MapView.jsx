import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { DEFAULT_ZOOM, HYDERABAD_CENTER } from '../lib/constants.js';
import { flowerIcon, immersionIcon, userIcon, waterIcon } from './markers.js';

const SELECT_ZOOM = 13;

function MapController({ user, selected, route }) {
  const map = useMap();
  const centeredOnUser = useRef(false);

  // Keep Leaflet's size in sync when the layout changes (mobile panels, orientation).
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  const userLat = user?.lat;
  const userLng = user?.lng;
  useEffect(() => {
    if (userLat != null && userLng != null && !centeredOnUser.current) {
      centeredOnUser.current = true;
      map.setView([userLat, userLng], 12);
    }
  }, [map, userLat, userLng]);

  const selectedLat = selected?.latitude;
  const selectedLng = selected?.longitude;
  useEffect(() => {
    if (selectedLat != null && selectedLng != null && !route) {
      map.flyTo([selectedLat, selectedLng], Math.max(map.getZoom(), SELECT_ZOOM), { duration: 0.5 });
    }
  }, [map, selectedLat, selectedLng, route]);

  useEffect(() => {
    if (route?.geometry?.length > 1) {
      map.fitBounds(route.geometry, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, route]);

  return null;
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
}) {
  const isSelected = (kind, id) => selected?.kind === kind && selected?.point?.id === id;

  return (
    <MapContainer
      center={HYDERABAD_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
      aria-label="Map of immersion and flower disposal points"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {layers.water &&
        waterBodies.map((body) => (
          <Marker
            key={body.id}
            position={[body.latitude, body.longitude]}
            icon={waterIcon()}
            title={`${body.name} (sensitive water body)`}
            eventHandlers={{ click: () => onSelect({ kind: 'water', point: body }) }}
          />
        ))}

      {immersion
        .filter((point) => (point.isArtificialPond ? layers.artificial : layers.immersion))
        .map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={immersionIcon(point, isSelected('immersion', point.id))}
            title={point.name}
            eventHandlers={{ click: () => onSelect({ kind: 'immersion', point }) }}
          />
        ))}

      {layers.flower &&
        flower.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={flowerIcon(isSelected('flower', point.id))}
            title={point.name}
            eventHandlers={{ click: () => onSelect({ kind: 'flower', point }) }}
          />
        ))}

      {route?.geometry?.length > 1 && (
        <Polyline positions={route.geometry} pathOptions={{ color: '#b3141b', weight: 5, opacity: 0.85 }} />
      )}

      {user && layers.user && (
        <Marker position={[user.lat, user.lng]} icon={userIcon()} title="Your starting point" interactive={false} />
      )}

      <MapController user={user} selected={selected?.point} route={route} />
    </MapContainer>
  );
}
