import { config } from '../config/index.js';
import { getStore, seedReferenceData } from '../db/index.js';

if (config.dataStore !== 'dynamodb') {
  console.log('DATA_STORE is "memory": data is seeded automatically each time the server starts.');
  process.exit(0);
}

try {
  const store = getStore();
  await store.ensureTables();
  const counts = await seedReferenceData(store);
  console.log(`Seeded ${counts.immersion} immersion points and ${counts.flower} flower points.`);
} catch (error) {
  console.error(`Seeding failed: ${error.name}: ${error.message}`);
  process.exit(1);
}
