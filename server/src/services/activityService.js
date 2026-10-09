// Activity service: records app-generated events used by the impact dashboard.
// Each record stores a baseline vs actual risk estimate (see README, "Impact method").
import { randomUUID } from 'node:crypto';
import { getStore } from '../db/index.js';
import { predict } from './pollutionService.js';

// Counterfactual assumption: without the app, the idol would have been immersed
// in an open natural water body. Documented in the README and shown in the UI.
const DESTINATION_WATER_TYPE = {
  NATURAL_LAKE: 'NATURAL_LAKE',
  ARTIFICIAL_POND: 'ARTIFICIAL_POND',
  HOME: 'HOME_CONTAINER',
};

export async function recordActivity(entry, origin = 'USER_GENERATED') {
  const base = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    origin,
    type: entry.type,
  };

  if (entry.type === 'FLOWER_DISPOSAL') {
    const record = {
      ...base,
      destinationId: entry.destinationId,
      flowerKg: entry.flowerKg,
      idolCount: 0,
    };
    await getStore().put('activity', record);
    return record;
  }

  const destinationKind =
    entry.type === 'HOME_IMMERSION' ? 'HOME' : entry.destinationIsArtificial ? 'ARTIFICIAL_POND' : 'NATURAL_LAKE';
  const common = {
    idolCount: entry.idolCount,
    material: entry.material,
    heightFt: entry.heightFt,
    flowerKg: 0,
  };
  const [baseline, actual] = await Promise.all([
    predict({ ...common, waterBodyType: DESTINATION_WATER_TYPE.NATURAL_LAKE }),
    predict({ ...common, waterBodyType: DESTINATION_WATER_TYPE[destinationKind] }),
  ]);

  const record = {
    ...base,
    destinationId: entry.destinationId ?? null,
    destinationKind,
    idolCount: entry.idolCount,
    material: entry.material,
    heightFt: entry.heightFt,
    riskBaseline: baseline.score,
    riskActual: actual.score,
    riskModelSource: actual.modelSource,
  };
  await getStore().put('activity', record);
  return record;
}
