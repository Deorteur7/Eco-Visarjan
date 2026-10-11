// Map icons, drawn as inline SVG (no image files, no emoji). One icon per kind of place:
//   immersion lake/tank  -> temple pin (red)
//   artificial pond      -> waves pin (orange)
//   flower disposal      -> flower pin (green)
//   sensitive water body -> water-drop dot (teal)
//   user location        -> pulsing dot (dark brown)
export const PIN_COLORS = {
  immersion: '#c43717',
  artificial: '#f5802a',
  flower: '#4d7a38',
  water: '#1f6f78',
  user: '#3b2112',
  route: '#c43717',
};

const PIN_PATH = 'M16 2C9.4 2 4 7.4 4 14c0 9 12 20 12 20s12-11 12-20C28 7.4 22.6 2 16 2z';

function Pin({ color, selected, label, children }) {
  return (
    <div className={`origin-bottom transition-transform duration-150 ${selected ? 'scale-125' : ''}`}>
      <svg
        width="32"
        height="36"
        viewBox="0 0 32 36"
        role="img"
        aria-label={label}
        className="block drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.4)]"
      >
        <path d={PIN_PATH} fill={color} stroke="#fff" strokeWidth="2" />
        {children}
      </svg>
    </div>
  );
}

const TempleGlyph = () => (
  <g fill="#fff">
    <path d="M16 7 L23 12 H9 Z" />
    <rect x="11" y="13" width="2" height="6" />
    <rect x="15" y="13" width="2" height="6" />
    <rect x="19" y="13" width="2" height="6" />
    <rect x="9" y="20" width="14" height="2" />
  </g>
);

const WavesGlyph = () => (
  <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <path d="M9 12c2-2 4-2 7 0s5 2 7 0" />
    <path d="M9 17c2-2 4-2 7 0s5 2 7 0" />
  </g>
);

const FlowerGlyph = () => (
  <g>
    <g fill="#fff">
      <circle cx="16" cy="9.5" r="2.6" />
      <circle cx="21.2" cy="13.3" r="2.6" />
      <circle cx="19.2" cy="19.4" r="2.6" />
      <circle cx="12.8" cy="19.4" r="2.6" />
      <circle cx="10.8" cy="13.3" r="2.6" />
    </g>
    <circle cx="16" cy="15" r="2.2" fill={PIN_COLORS.flower} />
  </g>
);

export function ImmersionPin({ point, selected }) {
  if (point.isArtificialPond) {
    return (
      <Pin color={PIN_COLORS.artificial} selected={selected} label={`Artificial pond: ${point.name}`}>
        <WavesGlyph />
      </Pin>
    );
  }
  return (
    <Pin color={PIN_COLORS.immersion} selected={selected} label={`Immersion point: ${point.name}`}>
      <TempleGlyph />
    </Pin>
  );
}

export function FlowerPin({ point, selected }) {
  return (
    <Pin color={PIN_COLORS.flower} selected={selected} label={`Flower disposal point: ${point.name}`}>
      <FlowerGlyph />
    </Pin>
  );
}

export function WaterDot({ body }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" role="img" aria-label={`Sensitive water body: ${body.name}`} className="block drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.35)]">
      <circle cx="13" cy="13" r="11" fill={PIN_COLORS.water} stroke="#fff" strokeWidth="2" />
      <path d="M13 6c3 3.6 5 6 5 8.4a5 5 0 0 1-10 0C8 12 10 9.6 13 6z" fill="#fff" />
    </svg>
  );
}

export function UserDot() {
  return (
    <div className="relative h-7 w-7" role="img" aria-label="Your location">
      <span className="eco-pulse absolute inset-0 rounded-full" style={{ background: PIN_COLORS.user }} />
      <svg width="28" height="28" viewBox="0 0 28 28" className="relative block">
        <circle cx="14" cy="14" r="11" fill="#fff" />
        <circle cx="14" cy="14" r="7" fill={PIN_COLORS.user} />
        <circle cx="14" cy="14" r="2.5" fill="#fff" />
      </svg>
    </div>
  );
}

/** The dot that travels along the route during the preview. */
export function TravelDot() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="block drop-shadow-[0_1px_2px_rgb(0_0_0/0.45)]">
      <circle cx="11" cy="11" r="9" fill={PIN_COLORS.route} stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
