import { config } from './config/index.js';
import { initStore } from './db/index.js';
import { createApp } from './app.js';

const init = await initStore();
const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`EcoVisarjan API listening on http://localhost:${config.port}`);
  console.log(`  data store : ${init.kind}${init.kind === 'memory' ? ' (seeded, not persisted)' : ''}`);
  if (init.kind === 'dynamodb' && init.health && !init.health.ok) {
    console.warn(
      '  DynamoDB tables are not ready. Run "npm run db:create" then "npm run db:seed". ' +
        `Details: ${JSON.stringify(init.health)}`,
    );
  }
  console.log(`  gemini     : ${config.gemini.apiKey ? `enabled (${config.gemini.model})` : 'not configured (manual material selection only)'}`);
  console.log(`  ml service : ${config.ml.baseUrl}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
