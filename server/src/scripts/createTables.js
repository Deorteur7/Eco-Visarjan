import { config } from '../config/index.js';
import { getStore } from '../db/index.js';
import { TABLES } from '../db/tables.js';

if (config.dataStore !== 'dynamodb') {
  console.error('DATA_STORE is not "dynamodb". Set DATA_STORE=dynamodb in server/.env first.');
  process.exit(1);
}

try {
  await getStore().ensureTables();
  console.log('DynamoDB tables are ready:');
  for (const name of Object.values(TABLES)) console.log(`  - ${name}`);
} catch (error) {
  console.error(`Could not create tables: ${error.name}: ${error.message}`);
  console.error('Check AWS credentials, AWS_REGION and IAM permissions (see README, AWS setup).');
  process.exit(1);
}
