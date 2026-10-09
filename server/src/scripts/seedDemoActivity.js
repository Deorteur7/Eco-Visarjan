// Generates clearly-flagged SIMULATED activity so the dashboard can be demoed.
// Records are tagged origin=SIMULATED_DEMO and are always shown separately from
// real user-generated activity. Never present them as real usage.
import { config } from '../config/index.js';
import { getStore, initStore } from '../db/index.js';
import { recordActivity } from '../services/activityService.js';

// ---- Tuneable constants ----------------------------------------------------
const SIMULATED_IMMERSIONS = 40;
const SIMULATED_FLOWER_VISITS = 25;
// -----------------------------------------------------------------------------

if (config.dataStore !== 'dynamodb') {
  console.log('DATA_STORE is "memory": simulated data would not outlive this script. Set DATA_STORE=dynamodb.');
  process.exit(0);
}

const pick = (items) => items[Math.floor(Math.random() * items.length)];

try {
  await initStore();
  const store = getStore();
  const immersion = (await store.list('immersion')).filter((p) => p.verification !== 'DEMO_PLACEHOLDER' || p.isArtificialPond);
  const flower = await store.list('flower');
  if (immersion.length === 0 || flower.length === 0) {
    console.error('No seed points found. Run "npm run db:seed" first.');
    process.exit(1);
  }

  for (let i = 0; i < SIMULATED_IMMERSIONS; i += 1) {
    const material = pick(['CLAY', 'PLASTER_OF_PARIS']);
    const heightFt = Number((1 + Math.random() * 5).toFixed(1));
    if (material === 'CLAY' && heightFt <= config.rules.homeImmersionMaxHeightFt && Math.random() < 0.5) {
      await recordActivity({ type: 'HOME_IMMERSION', idolCount: 1, material, heightFt }, 'SIMULATED_DEMO');
    } else {
      const point = pick(immersion);
      await recordActivity(
        {
          type: 'DESIGNATED_GUIDED',
          idolCount: 1 + Math.floor(Math.random() * 3),
          material,
          heightFt,
          destinationId: point.id,
          destinationIsArtificial: Boolean(point.isArtificialPond),
        },
        'SIMULATED_DEMO',
      );
    }
  }
  for (let i = 0; i < SIMULATED_FLOWER_VISITS; i += 1) {
    await recordActivity(
      {
        type: 'FLOWER_DISPOSAL',
        destinationId: pick(flower).id,
        flowerKg: Number((0.5 + Math.random() * 6).toFixed(1)),
      },
      'SIMULATED_DEMO',
    );
  }
  console.log(`Wrote ${SIMULATED_IMMERSIONS + SIMULATED_FLOWER_VISITS} SIMULATED_DEMO activity records.`);
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
}
