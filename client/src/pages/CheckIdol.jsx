import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api.js';
import { MATERIAL_LABEL, MATERIALS } from '../lib/constants.js';
import { percent } from '../lib/format.js';
import { prepareImage } from '../lib/image.js';
import { useSession } from '../context/SessionContext.jsx';
import { ErrorNotice, InfoNotice, PageHeading, Spinner } from '../components/ui.jsx';

const HOME_STEPS = [
  { title: 'Fill a large container with water', text: 'Use a clean bucket or tub deep enough to cover the idol.' },
  { title: 'Immerse gently, following your own ritual', text: 'Place the idol in the water and perform your preferred prayer or ritual.' },
  { title: 'Let the clay dissolve and settle', text: 'Leave the container undisturbed until the clay has softened and settled.' },
  { title: 'Reuse the water and soil only if plant-safe', text: 'If no synthetic paint, glitter or plastic was used, the settled soil and water can go to plants. Otherwise dispose of them as household waste.' },
];

export default function CheckIdol() {
  const navigate = useNavigate();
  const { idol, setIdol } = useSession();
  const [heightFt, setHeightFt] = useState(idol?.heightFt ? String(idol.heightFt) : '');
  const [preview, setPreview] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [classification, setClassification] = useState(null);
  const [material, setMaterial] = useState(idol?.material ?? '');
  const [options, setOptions] = useState(null);
  const previewUrl = useRef(null);

  useEffect(() => () => previewUrl.current && URL.revokeObjectURL(previewUrl.current), []);

  const height = Number(heightFt);
  const heightValid = heightFt !== '' && height >= 0.5 && height <= 80;

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setClassification(null);
    setOptions(null);
    try {
      const prepared = await prepareImage(file);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = URL.createObjectURL(prepared);
      setPreview(previewUrl.current);
      setBlob(prepared);
    } catch (err) {
      setError(err.message);
    }
  }

  async function classify() {
    if (!blob || !heightValid) return;
    setBusy(true);
    setError(null);
    setOptions(null);
    try {
      const form = new FormData();
      form.set('heightFt', String(height));
      form.set('image', blob, 'idol.jpg');
      const result = await api.classify(form);
      setClassification(result.classification);
      if (!result.classification.requiresManualVerification) {
        setMaterial(result.classification.material);
        setOptions(result.options);
        setIdol({ material: result.classification.material, heightFt: height, source: 'GEMINI' });
      } else {
        setMaterial('');
      }
    } catch (err) {
      setError(err);
      setClassification(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmMaterial(chosen) {
    setMaterial(chosen);
    if (!chosen || !heightValid) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.options({ material: chosen, heightFt: height });
      setOptions(result);
      setIdol({ material: chosen, heightFt: height, source: 'MANUAL' });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const needsManual = Boolean(classification?.requiresManualVerification) || (!classification && Boolean(error));
  const showManualPicker = needsManual || (!classification && !blob);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading title="Check my idol">
        Add a photo and the height. We will suggest whether the idol is clay or plaster of Paris, and you confirm the
        result. A photo cannot always tell the two apart, so your confirmation matters.
      </PageHeading>

      <section className="card space-y-4" aria-labelledby="step1">
        <h2 id="step1" className="text-lg">1. Photo and height</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="btn btn-secondary cursor-pointer">
            Upload a photo
            <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
          </label>
          <label className="btn btn-secondary cursor-pointer">
            Use the camera
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} />
          </label>
        </div>

        {preview && (
          <img src={preview} alt="Preview of the idol photo you selected" className="max-h-72 w-full rounded-lg border border-line object-contain bg-cream" />
        )}

        <div className="max-w-xs">
          <label className="field-label" htmlFor="height">Idol height (feet)</label>
          <input
            id="height"
            className="input"
            type="number"
            inputMode="decimal"
            min="0.5"
            max="80"
            step="0.1"
            value={heightFt}
            onChange={(event) => setHeightFt(event.target.value)}
            aria-invalid={heightFt !== '' && !heightValid}
          />
          {heightFt !== '' && !heightValid && <p className="mt-1 text-sm text-kumkum">Enter a height between 0.5 and 80 feet.</p>}
        </div>

        <button type="button" className="btn btn-primary" onClick={classify} disabled={!blob || !heightValid || busy}>
          Identify the material
        </button>
        {busy && <Spinner label="Working" />}
        {error && (
          <ErrorNotice title="Could not identify the idol automatically">
            {error.message ?? String(error)} You can choose the material yourself below.
          </ErrorNotice>
        )}
      </section>

      {classification && (
        <section className="card space-y-3" aria-labelledby="result">
          <h2 id="result" className="text-lg">Result</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${classification.material === 'UNKNOWN' ? 'badge-orange' : 'badge-green'}`}>
              {MATERIAL_LABEL[classification.material]}
            </span>
            <span className="text-sm text-muted">Confidence {percent(classification.confidence)}</span>
          </div>
          <p className="text-sm">{classification.explanation}</p>
          {classification.visibleCues?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {classification.visibleCues.map((cue) => (
                <li key={cue} className="badge badge-neutral">{cue}</li>
              ))}
            </ul>
          )}
          {classification.requiresManualVerification && (
            <InfoNotice tone="orange" title="Please verify the material">
              We could not be sure from the photo. Choose the material below. If you are unsure, pick &quot;Not sure&quot; and we will treat it cautiously.
            </InfoNotice>
          )}
        </section>
      )}

      {(showManualPicker || (classification && !classification.requiresManualVerification)) && heightValid && (
        <section className="card space-y-3" aria-labelledby="confirm">
          <h2 id="confirm" className="text-lg">
            {showManualPicker ? 'Choose the material' : 'Is this correct?'}
          </h2>
          <div role="radiogroup" aria-labelledby="confirm" className="flex flex-wrap gap-2">
            {MATERIALS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={material === item.value}
                className={`btn btn-small ${material === item.value ? 'btn-dark' : 'btn-secondary'}`}
                onClick={() => confirmMaterial(item.value)}
                disabled={busy}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {options && (
        <section className="space-y-4" aria-labelledby="options">
          <h2 id="options" className="text-xl">Your options</h2>
          <InfoNotice tone={options.homeImmersionEligible ? 'green' : 'yellow'}>{options.reason}</InfoNotice>

          {options.homeImmersionEligible && (
            <div className="card space-y-3">
              <h3 className="text-lg">Eco-friendly home immersion</h3>
              <p className="text-sm text-muted">
                Immersing a small clay idol at home keeps idol material out of lakes and ponds. This is presented as an
                environmental option only, not as a religious ruling. Follow the customs of your own family.
              </p>
              <ol className="space-y-3">
                {HOME_STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf font-bold text-white">{index + 1}</span>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-muted">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <HomeImmersionLog material={material} heightFt={height} />
            </div>
          )}

          <div className="card space-y-3">
            <h3 className="text-lg">Designated immersion location</h3>
            <p className="text-sm text-muted">
              Find the most suitable site near you, ranked by distance, idol size, material, facility type and availability.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/map?find=1')}>
              {options.homeImmersionEligible ? 'I want to immerse at a designated location instead' : 'Find a designated location'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function HomeImmersionLog({ material, heightFt }) {
  const [state, setState] = useState('idle');

  async function log() {
    setState('saving');
    try {
      await api.recordActivity({ type: 'HOME_IMMERSION', idolCount: 1, material, heightFt });
      setState('saved');
    } catch {
      setState('error');
    }
  }

  if (state === 'saved') return <p className="text-sm font-semibold text-leaf">Thank you. Your home immersion is counted on the impact page.</p>;
  return (
    <div>
      <button type="button" className="btn btn-secondary btn-small" onClick={log} disabled={state === 'saving'}>
        Count my home immersion
      </button>
      {state === 'error' && <p className="mt-1 text-sm text-kumkum">Could not save that. Please try again.</p>}
    </div>
  );
}
