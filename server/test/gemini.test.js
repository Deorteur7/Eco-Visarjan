import './setup.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseClassification } from '../src/services/geminiService.js';

const good = (overrides = {}) =>
  JSON.stringify({
    isGaneshaIdol: true, material: 'CLAY', confidence: 0.9,
    explanation: 'Matte earthy surface.', visibleCues: ['matte'], ...overrides,
  });

describe('parseClassification', () => {
  it('accepts a valid confident clay result', () => {
    const result = parseClassification(good());
    assert.equal(result.material, 'CLAY');
    assert.equal(result.requiresManualVerification, false);
  });

  it('downgrades low confidence to UNKNOWN', () => {
    const result = parseClassification(good({ confidence: 0.3 }));
    assert.equal(result.material, 'UNKNOWN');
    assert.equal(result.requiresManualVerification, true);
  });

  it('rejects arbitrary material strings', () => {
    const result = parseClassification(good({ material: 'MARBLE' }));
    assert.equal(result.material, 'UNKNOWN');
    assert.equal(result.validated, false);
  });

  it('rejects non-JSON output', () => {
    assert.equal(parseClassification('Sure! It is clay.').material, 'UNKNOWN');
  });

  it('returns UNKNOWN when the photo is not a Ganesh idol', () => {
    const result = parseClassification(good({ isGaneshaIdol: false }));
    assert.equal(result.material, 'UNKNOWN');
  });
});
