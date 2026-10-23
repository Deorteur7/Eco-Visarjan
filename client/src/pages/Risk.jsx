import { useState } from 'react';
import { api } from '../lib/api.js';
import { MATERIALS } from '../lib/constants.js';
import { ErrorNotice, InfoNotice, PageHeading, Spinner } from '../components/ui.jsx';

const WATER_TYPES = [
  { value: 'NATURAL_LAKE', label: 'Natural lake or tank' },
  { value: 'ARTIFICIAL_POND', label: 'Artificial pond' },
  { value: 'HOME_CONTAINER', label: 'Container at home' },
];

const LEVEL_STYLE = {
  LOW: { badge: 'badge-green', text: 'Low' },
  MEDIUM: { badge: 'badge-yellow', text: 'Medium' },
  HIGH: { badge: 'badge-red', text: 'High' },
};

const initial = { idolCount: '50', material: 'PLASTER_OF_PARIS', heightFt: '4', flowerKg: '40', waterBodyType: 'NATURAL_LAKE', baselineBodMgL: '', baselineDoMgL: '' };

export default function Risk() {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      idolCount: Number(form.idolCount),
      material: form.material,
      heightFt: Number(form.heightFt),
      flowerKg: Number(form.flowerKg || 0),
      waterBodyType: form.waterBodyType,
    };
    if (form.baselineBodMgL !== '' && form.baselineDoMgL !== '') {
      body.baselineBodMgL = Number(form.baselineBodMgL);
      body.baselineDoMgL = Number(form.baselineDoMgL);
    }
    try {
      setResult(await api.predict(body));
    } catch (err) {
      setError(err);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  const style = result ? LEVEL_STYLE[result.level] : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      <div>
        <PageHeading title="Pollution-risk estimator">
          Compare how different choices change a relative pollution-risk index for an immersion event.
        </PageHeading>
        <form onSubmit={submit} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="idolCount">Number of idols</label>
              <input id="idolCount" className="input" type="number" min="0" max="5000" step="1" required value={form.idolCount} onChange={set('idolCount')} />
            </div>
            <div>
              <label className="field-label" htmlFor="heightFt">Average height (feet)</label>
              <input id="heightFt" className="input" type="number" min="0.5" max="80" step="0.1" required value={form.heightFt} onChange={set('heightFt')} />
            </div>
            <div>
              <label className="field-label" htmlFor="material">Material</label>
              <select id="material" className="input" value={form.material} onChange={set('material')}>
                {MATERIALS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="flowerKg">Flower waste (kg)</label>
              <input id="flowerKg" className="input" type="number" min="0" max="5000" step="0.5" value={form.flowerKg} onChange={set('flowerKg')} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="waterBodyType">Where it is immersed</label>
            <select id="waterBodyType" className="input" value={form.waterBodyType} onChange={set('waterBodyType')}>
              {WATER_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </div>
          <details className="rounded-lg border border-line p-3">
            <summary className="cursor-pointer text-sm font-semibold">Optional: baseline water quality</summary>
            <p className="mt-2 text-sm text-muted">If you know recent readings for the water body, enter both. Otherwise typical urban-lake defaults are used.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="bod">BOD (mg/L)</label>
                <input id="bod" className="input" type="number" min="0" max="200" step="0.1" value={form.baselineBodMgL} onChange={set('baselineBodMgL')} />
              </div>
              <div>
                <label className="field-label" htmlFor="do">Dissolved oxygen (mg/L)</label>
                <input id="do" className="input" type="number" min="0" max="20" step="0.1" value={form.baselineDoMgL} onChange={set('baselineDoMgL')} />
              </div>
            </div>
          </details>
          <button type="submit" className="btn btn-primary" disabled={busy}>Estimate risk</button>
        </form>
      </div>

      <div className="space-y-4 lg:pt-24">
        {busy && <Spinner label="Estimating" />}
        {error && <ErrorNotice>{error.message}</ErrorNotice>}
        {!result && !busy && !error && (
          <div className="card text-sm text-muted">Enter the details and choose &quot;Estimate risk&quot; to see the result.</div>
        )}
        {result && (
          <div className="card space-y-4" aria-live="polite">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`badge ${style.badge} !text-base`}>{style.text} risk</span>
              <span className="font-serif text-3xl font-bold">{result.score}<span className="text-base font-normal text-muted"> / 100</span></span>
            </div>
            <p className="text-sm font-semibold text-saffron">{result.label}</p>
            {result.modelSource === 'FALLBACK_HEURISTIC' && (
              <InfoNotice tone="orange" title="Using the built-in formula">
                The ML service was not reachable ({result.fallbackReason}), so the reference formula was used instead.
              </InfoNotice>
            )}
            {result.whatIf?.length > 0 && (
              <div>
                <h2 className="text-base">What would lower it most</h2>
                <ul className="mt-2 space-y-2">
                  {result.whatIf.map((item) => (
                    <li key={item.factor} className="flex items-start justify-between gap-3 rounded-lg bg-cream p-2 text-sm">
                      <span><span className="font-semibold">{item.scenario}</span><br /><span className="text-muted">{item.factor}</span></span>
                      <span className="whitespace-nowrap font-semibold">{item.pointsReduced > 0 ? `-${item.pointsReduced} pts` : 'no change'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
