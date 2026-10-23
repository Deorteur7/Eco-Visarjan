// Pollution prediction service. Calls the Python ML service; falls back to the
// reference formula when the service is unavailable, and says so in the response.
import { config } from '../config/index.js';
import {
  DEFAULT_BOD_MGL,
  DEFAULT_DO_MGL,
  formulaScore,
  levelFor,
} from './pollutionFormula.js';

export const DISCLAIMER =
  'Relative pollution-risk index built from documented assumptions and synthetic training data. It is not measured water-quality data and does not predict real water chemistry.';

export function normaliseInput(input) {
  const baselineProvided = input.baselineBodMgL != null && input.baselineDoMgL != null;
  return {
    idolCount: input.idolCount,
    material: input.material,
    heightFt: input.heightFt,
    flowerKg: input.flowerKg ?? 0,
    waterBodyType: input.waterBodyType ?? 'NATURAL_LAKE',
    baselineBodMgL: input.baselineBodMgL ?? DEFAULT_BOD_MGL,
    baselineDoMgL: input.baselineDoMgL ?? DEFAULT_DO_MGL,
    baselineProvided,
  };
}

async function callMlService(input) {
  const response = await fetch(`${config.ml.baseUrl}/predict`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      idol_count: input.idolCount,
      material: input.material,
      height_ft: input.heightFt,
      flower_kg: input.flowerKg,
      water_body_type: input.waterBodyType,
      baseline_bod_mgl: input.baselineBodMgL,
      baseline_do_mgl: input.baselineDoMgL,
    }),
    signal: AbortSignal.timeout(config.ml.timeoutMs),
  });
  if (!response.ok) throw new Error(`ML service responded ${response.status}`);
  const data = await response.json();
  if (typeof data.score !== 'number' || !['LOW', 'MEDIUM', 'HIGH'].includes(data.level)) {
    throw new Error('ML service returned an unexpected payload');
  }
  return {
    level: data.level,
    score: data.score,
    whatIf: data.what_if ?? [],
    modelSource: 'ML_SERVICE',
    modelInfo: data.model_info ?? null,
  };
}

export async function predict(rawInput) {
  const input = normaliseInput(rawInput);
  let result;
  try {
    result = await callMlService(input);
  } catch (error) {
    const score = formulaScore(input);
    result = {
      level: levelFor(score),
      score,
      whatIf: [],
      modelSource: 'FALLBACK_HEURISTIC',
      modelInfo: null,
      fallbackReason: error.name === 'TimeoutError' ? 'ML service timed out' : 'ML service unavailable',
    };
  }
  return {
    ...result,
    input: {
      ...input,
    },
    label: 'ML estimate',
    disclaimer: DISCLAIMER,
  };
}

export async function mlHealth() {
  try {
    const response = await fetch(`${config.ml.baseUrl}/health`, {
      signal: AbortSignal.timeout(config.ml.timeoutMs),
    });
    return { reachable: response.ok };
  } catch {
    return { reachable: false };
  }
}
