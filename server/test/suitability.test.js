import './setup.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluatePoint } from '../src/services/suitability.js';

const artificial = {
  id: 'a', isArtificialPond: true, maxIdolSizeFt: 4, allowedMaterials: ['CLAY', 'PLASTER_OF_PARIS'],
  isActive: true, verification: 'OFFICIAL_IMPORT', coordinateAccuracy: 'SURVEYED',
};
const natural = {
  id: 'n', isArtificialPond: false, maxIdolSizeFt: null, allowedMaterials: null,
  isActive: true, verification: 'SOURCE_NAMED', coordinateAccuracy: 'APPROXIMATE',
};

describe('evaluatePoint', () => {
  it('excludes a site when the idol is taller than the limit', () => {
    const result = evaluatePoint(artificial, { material: 'CLAY', heightFt: 6 }, 2);
    assert.equal(result.eligible, false);
    assert.match(result.exclusions[0], /taller/);
  });

  it('excludes inactive sites', () => {
    const result = evaluatePoint({ ...artificial, isActive: false }, { material: 'CLAY', heightFt: 2 }, 1);
    assert.equal(result.eligible, false);
  });

  it('excludes a site that does not accept the material', () => {
    const result = evaluatePoint({ ...artificial, allowedMaterials: ['CLAY'] }, { material: 'PLASTER_OF_PARIS', heightFt: 2 }, 1);
    assert.equal(result.eligible, false);
  });

  it('prefers an artificial pond over a natural lake for plaster of Paris at equal distance', () => {
    const idol = { material: 'PLASTER_OF_PARIS', heightFt: 3 };
    assert.ok(evaluatePoint(artificial, idol, 5).score > evaluatePoint(natural, idol, 5).score);
  });

  it('scores nearer sites higher, all else equal', () => {
    const idol = { material: 'CLAY', heightFt: 3 };
    assert.ok(evaluatePoint(artificial, idol, 1).score > evaluatePoint(artificial, idol, 20).score);
  });

  it('warns when a source does not publish limits and never invents them', () => {
    const result = evaluatePoint(natural, { material: 'CLAY', heightFt: 3 }, 2);
    assert.equal(result.eligible, true);
    assert.ok(result.warnings.some((w) => /not published/.test(w)));
  });

  it('ranks demo placeholders below an otherwise identical real site', () => {
    const idol = { material: 'CLAY', heightFt: 2 };
    const demo = { ...artificial, verification: 'DEMO_PLACEHOLDER' };
    assert.ok(evaluatePoint(artificial, idol, 3).score > evaluatePoint(demo, idol, 3).score);
  });
});
