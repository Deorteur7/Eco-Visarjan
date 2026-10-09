import { useState } from 'react';
import { FALLBACK_AREAS } from '../lib/constants.js';
import { getCurrentPosition } from '../lib/geo.js';
import { useSession } from '../context/SessionContext.jsx';
import { ErrorNotice, Spinner } from './ui.jsx';

/** Asks for browser geolocation, with a manual area picker if it is unavailable or denied. */
export default function LocationCard({ compact = false }) {
  const { location, setLocation } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function useGps() {
    setBusy(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      setLocation({ ...position, source: 'GPS', label: 'Your location' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function pickArea(event) {
    const area = FALLBACK_AREAS.find((item) => item.label === event.target.value);
    if (area) {
      setError(null);
      setLocation({ lat: area.lat, lng: area.lng, source: 'AREA', label: `${area.label} (approximate area)` });
    }
  }

  if (location && compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          <span className="font-semibold">Starting point:</span> {location.label}
        </span>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setLocation(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold">Where are you starting from?</p>
        <p className="text-sm text-muted">
          Your location is used only in your browser and in requests to find nearby sites. It is not stored.
        </p>
      </div>
      <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={useGps} disabled={busy}>
        Use my current location
      </button>
      {busy && <Spinner label="Finding your location" />}
      {error && <ErrorNotice title="Location unavailable">{error}</ErrorNotice>}
      <div>
        <label className="field-label" htmlFor="area-picker">
          Or choose your area
        </label>
        <select id="area-picker" className="input" defaultValue="" onChange={pickArea}>
          <option value="" disabled>
            Select an area
          </option>
          {FALLBACK_AREAS.map((area) => (
            <option key={area.label} value={area.label}>
              {area.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
