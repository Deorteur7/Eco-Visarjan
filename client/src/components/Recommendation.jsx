import { formatDistance } from '../lib/format.js';
import { VerificationBadge } from './ui.jsx';

const FACTORS = [
  ['distance', 'Distance'],
  ['facility', 'Facility type'],
  ['sizeFit', 'Idol size fit'],
  ['material', 'Material fit'],
  ['status', 'Availability'],
];

export default function Recommendation({ data, onSelect }) {
  const best = data.recommended;
  if (!best) {
    return (
      <div className="card text-sm">
        <p className="font-semibold">No suitable site found</p>
        <p className="mt-1 text-muted">{data.explanation}</p>
      </div>
    );
  }
  return (
    <div className="card space-y-3 border-kumkum/50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-red">Recommended for your idol</span>
        <VerificationBadge verification={best.verification} />
      </div>
      <div>
        <h3 className="text-lg">{best.name}</h3>
        <p className="text-sm text-muted">{best.area} &middot; {formatDistance(best.distanceKm)} away</p>
      </div>
      <p className="text-sm">{data.explanation}</p>
      {best.reasons.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {best.reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      )}
      <div className="space-y-1">
        {FACTORS.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-muted">{label}</span>
            <div className="h-2 flex-1 rounded-full bg-cream" role="presentation">
              <div className="h-2 rounded-full bg-saffron" style={{ width: `${Math.round(best.breakdown[key] * 100)}%` }} />
            </div>
            <span className="w-9 text-right tabular-nums">{Math.round(best.breakdown[key] * 100)}%</span>
          </div>
        ))}
      </div>
      {best.warnings.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted">
          {best.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}
      <button type="button" className="btn btn-primary w-full" onClick={() => onSelect({ kind: 'immersion', point: best })}>
        Select this site and get directions
      </button>
      <p className="text-xs text-muted">{data.method}</p>
      {data.alternatives.length > 0 && (
        <div className="border-t border-line pt-2">
          <p className="text-sm font-semibold">Other options</p>
          <ul className="mt-1 space-y-1">
            {data.alternatives.map((alt) => (
              <li key={alt.id}>
                <button type="button" className="w-full rounded-md p-2 text-left text-sm hover:bg-cream" onClick={() => onSelect({ kind: 'immersion', point: alt })}>
                  <span className="font-semibold">{alt.rank}. {alt.name}</span>
                  <span className="text-muted"> &middot; {formatDistance(alt.distanceKm)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.excluded.length > 0 && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">Sites skipped for this idol</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {data.excluded.map((item) => <li key={item.id}>{item.name}: {item.reasons.join('; ')}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
