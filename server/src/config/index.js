// Central configuration. All secrets come from environment variables (.env).
// Tuneable constants are grouped at the top of each section.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Load server/.env when present (built into Node, no dotenv package needed).
const envFile = path.join(serverRoot, '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== '' && value !== undefined ? parsed : fallback;
};

const str = (value, fallback = '') => (value && value.trim() !== '' ? value.trim() : fallback);

export const config = {
  env: str(process.env.NODE_ENV, 'development'),
  port: num(process.env.PORT, 8080),
  corsOrigin: str(process.env.CORS_ORIGIN, ''),
  serverRoot,
  clientDist: path.resolve(serverRoot, '..', 'client', 'dist'),

  // ---- Data store -------------------------------------------------------
  // "dynamodb" uses AWS DynamoDB (or DynamoDB Local when DYNAMODB_ENDPOINT is set).
  // "memory" keeps data in process memory only (quick local try-out, nothing persisted).
  dataStore: str(process.env.DATA_STORE, 'memory').toLowerCase(),
  aws: {
    region: str(process.env.AWS_REGION, 'ap-south-1'),
    endpoint: str(process.env.DYNAMODB_ENDPOINT, ''),
    tablePrefix: str(process.env.DYNAMODB_TABLE_PREFIX, 'ecovisarjan'),
  },

  // ---- Gemini -----------------------------------------------------------
  gemini: {
    apiKey: str(process.env.GEMINI_API_KEY),
    model: str(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
    timeoutMs: num(process.env.GEMINI_TIMEOUT_MS, 30000),
  },

  // ---- Routing ----------------------------------------------------------
  routing: {
    orsApiKey: str(process.env.ORS_API_KEY),
    osrmBaseUrl: str(process.env.OSRM_BASE_URL, 'https://router.project-osrm.org'),
    timeoutMs: num(process.env.ROUTING_TIMEOUT_MS, 8000),
  },

  // ---- ML service -------------------------------------------------------
  ml: {
    baseUrl: str(process.env.ML_SERVICE_URL, 'http://127.0.0.1:8000'),
    timeoutMs: num(process.env.ML_TIMEOUT_MS, 4000),
  },

  // ---- Business rules (tuneable) ---------------------------------------
  rules: {
    // Clay idols up to this height (feet) are offered the home-immersion option.
    homeImmersionMaxHeightFt: num(process.env.HOME_IMMERSION_MAX_HEIGHT_FT, 2),
    maxIdolHeightFt: 80,
    maxIdolCount: 500,
    maxFlowerKg: 500,
  },
};

export const isProduction = config.env === 'production';
