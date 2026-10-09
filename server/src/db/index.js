import { config } from '../config/index.js';
import { createDynamoStore } from './dynamoStore.js';
import { createMemoryStore } from './memoryStore.js';
import { immersionPoints } from '../data/immersionPoints.js';
import { flowerPoints } from '../data/flowerPoints.js';

let store;

/** Returns the process-wide data store (created lazily). */
export function getStore() {
  if (!store) {
    if (config.dataStore === 'dynamodb') {
      store = createDynamoStore();
    } else if (config.dataStore === 'memory') {
      store = createMemoryStore();
    } else {
      throw new Error(`DATA_STORE must be "dynamodb" or "memory" (got "${config.dataStore}").`);
    }
  }
  return store;
}

/** Writes the seed reference data (idempotent: puts overwrite by id). */
export async function seedReferenceData(target = getStore()) {
  const stamp = new Date().toISOString();
  await target.putMany(
    'immersion',
    immersionPoints.map((point) => ({ ...point, updatedAt: stamp })),
  );
  await target.putMany(
    'flower',
    flowerPoints.map((point) => ({ ...point, updatedAt: stamp })),
  );
  return { immersion: immersionPoints.length, flower: flowerPoints.length };
}

/** Prepares the store at startup. Memory mode auto-seeds; DynamoDB mode only checks. */
export async function initStore() {
  const target = getStore();
  if (target.kind === 'memory') {
    await seedReferenceData(target);
    return { kind: 'memory', seeded: true };
  }
  const health = await target.health();
  return { kind: 'dynamodb', seeded: false, health };
}
