// Imports official/verified points from a JSON file into the data store.
// Usage: npm run db:import -- immersion path/to/points.json
//        npm run db:import -- flower path/to/points.json
// See data/imports/ for the expected shape.
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { config } from '../config/index.js';
import { getStore } from '../db/index.js';

const [kind, file] = process.argv.slice(2);
if (!['immersion', 'flower'].includes(kind) || !file) {
  console.error('Usage: npm run db:import -- <immersion|flower> <file.json>');
  process.exit(1);
}

const base = {
  id: z.string().min(1),
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  area: z.string().default(''),
  isActive: z.boolean().nullable().default(true),
  source: z.string().min(1, 'source is required for imported records'),
  sourceUrl: z.string().default(''),
  statusNote: z.string().default(''),
  coordinateAccuracy: z.enum(['SURVEYED', 'APPROXIMATE']).default('APPROXIMATE'),
  verification: z.enum(['OFFICIAL_IMPORT', 'SOURCE_NAMED']).default('OFFICIAL_IMPORT'),
};
const schemas = {
  immersion: z.object({
    ...base,
    type: z.enum(['NATURAL_LAKE', 'ARTIFICIAL_POND']),
    maxIdolSizeFt: z.number().positive().nullable().default(null),
    allowedMaterials: z.array(z.enum(['CLAY', 'PLASTER_OF_PARIS'])).nullable().default(null),
    isArtificialPond: z.boolean(),
  }),
  flower: z.object({
    ...base,
    type: z.literal('FLOWER_COLLECTION').default('FLOWER_COLLECTION'),
    acceptedWaste: z.array(z.string()).default(['FLOWERS', 'LEAVES', 'DECORATIONS_ORGANIC']),
  }),
};

try {
  const raw = JSON.parse(await readFile(file, 'utf8'));
  const parsed = z.array(schemas[kind]).safeParse(raw);
  if (!parsed.success) {
    console.error('Validation failed:');
    for (const issue of parsed.error.issues) console.error(`  [${issue.path.join('.')}] ${issue.message}`);
    process.exit(1);
  }
  if (config.dataStore !== 'dynamodb') {
    console.warn('DATA_STORE is "memory": imported data would only live inside this script. Set DATA_STORE=dynamodb.');
    process.exit(1);
  }
  const store = getStore();
  const stamp = new Date().toISOString();
  await store.putMany(kind, parsed.data.map((item) => ({ ...item, updatedAt: stamp })));
  console.log(`Imported ${parsed.data.length} ${kind} points.`);
} catch (error) {
  console.error(`Import failed: ${error.message}`);
  process.exit(1);
}
