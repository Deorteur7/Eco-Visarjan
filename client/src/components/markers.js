// Leaflet marker icons drawn as inline SVG (no image files, no emoji).
import L from 'leaflet';

const COLORS = {
  immersion: '#b3141b',
  artificial: '#e8650a',
  flower: '#2e6b3f',
  water: '#1f6f78',
  user: '#2b1414',
};

const PIN = 'M16 2C9.4 2 4 7.4 4 14c0 9 12 20 12 20s12-11 12-20C28 7.4 22.6 2 16 2z';

const GLYPHS = {
  // temple silhouette
  immersion:
    '<path d="M16 7 L23 12 H9 Z" fill="#fff"/><rect x="11" y="13" width="2" height="6" fill="#fff"/><rect x="15" y="13" width="2" height="6" fill="#fff"/><rect x="19" y="13" width="2" height="6" fill="#fff"/><rect x="9" y="20" width="14" height="2" fill="#fff"/>',
  // two waves
  artificial:
    '<path d="M9 12c2-2 4-2 7 0s5 2 7 0" stroke="#fff" fill="none" stroke-width="2" stroke-linecap="round"/><path d="M9 17c2-2 4-2 7 0s5 2 7 0" stroke="#fff" fill="none" stroke-width="2" stroke-linecap="round"/>',
  // five-petal flower
  flower:
    '<g fill="#fff"><circle cx="16" cy="9.5" r="2.6"/><circle cx="21.2" cy="13.3" r="2.6"/><circle cx="19.2" cy="19.4" r="2.6"/><circle cx="12.8" cy="19.4" r="2.6"/><circle cx="10.8" cy="13.3" r="2.6"/></g><circle cx="16" cy="15" r="2.2" fill="#2e6b3f"/>',
};

const cache = new Map();

function pinIcon(kind, selected) {
  const key = `${kind}-${selected}`;
  if (!cache.has(key)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="36" viewBox="0 0 32 36" aria-hidden="true"><path d="${PIN}" fill="${COLORS[kind]}" stroke="#fff" stroke-width="2"/>${GLYPHS[kind]}</svg>`;
    cache.set(
      key,
      L.divIcon({
        html: svg,
        className: `eco-marker${selected ? ' is-selected' : ''}`,
        iconSize: [32, 36],
        iconAnchor: [16, 34],
      }),
    );
  }
  return cache.get(key);
}

function dotIcon(kind) {
  const key = `dot-${kind}`;
  if (!cache.has(key)) {
    const svg =
      kind === 'user'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="11" fill="#fff"/><circle cx="13" cy="13" r="7" fill="${COLORS.user}"/><circle cx="13" cy="13" r="2.5" fill="#fff"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="11" fill="${COLORS.water}" stroke="#fff" stroke-width="2"/><path d="M13 6c3 3.6 5 6 5 8.4a5 5 0 0 1-10 0C8 12 10 9.6 13 6z" fill="#fff"/></svg>`;
    cache.set(
      key,
      L.divIcon({ html: svg, className: 'eco-marker eco-marker-dot', iconSize: [26, 26], iconAnchor: [13, 13] }),
    );
  }
  return cache.get(key);
}

export const immersionIcon = (point, selected) => pinIcon(point.isArtificialPond ? 'artificial' : 'immersion', selected);
export const flowerIcon = (selected) => pinIcon('flower', selected);
export const waterIcon = () => dotIcon('water');
export const userIcon = () => dotIcon('user');
export const LEGEND_COLORS = COLORS;
