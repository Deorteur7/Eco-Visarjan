import { VERIFICATION } from '../lib/constants.js';

export function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#e6d7b0" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="#b3141b" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span>{label}…</span>
    </div>
  );
}

export function ErrorNotice({ title = 'Something went wrong', children, onRetry }) {
  return (
    <div role="alert" className="rounded-lg border border-kumkum/40 bg-kumkum-soft p-3 text-sm text-ink">
      <p className="font-semibold text-kumkum-dark">{title}</p>
      {children && <p className="mt-1">{children}</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-small mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function InfoNotice({ title, children, tone = 'yellow' }) {
  const tones = {
    yellow: 'border-turmeric/60 bg-turmeric-soft/60',
    orange: 'border-saffron/50 bg-saffron-soft',
    green: 'border-leaf/40 bg-leaf-soft',
    water: 'border-water/40 bg-water-soft',
  };
  return (
    <div className={`rounded-lg border p-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? 'mt-1' : ''}>{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white/60 p-4 text-center text-sm text-muted">
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="mt-1">{children}</p>}
    </div>
  );
}

export function VerificationBadge({ verification }) {
  const info = VERIFICATION[verification] ?? { label: verification, tone: 'badge-neutral' };
  return <span className={`badge ${info.tone}`}>{info.label}</span>;
}

export function PageHeading({ title, children }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl text-ink sm:text-3xl">{title}</h1>
      {children && <p className="mt-2 max-w-2xl text-muted">{children}</p>}
    </div>
  );
}
