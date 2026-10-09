import { config } from '../config/index.js';

// Logical table keys used throughout the code -> physical DynamoDB table names.
const prefix = config.aws.tablePrefix;

export const TABLES = {
  immersion: `${prefix}-immersion-points`,
  flower: `${prefix}-flower-points`,
  activity: `${prefix}-activity`,
};

export const TABLE_KEYS = Object.keys(TABLES);
