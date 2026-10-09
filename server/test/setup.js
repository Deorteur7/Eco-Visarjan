// Imported first so configuration is deterministic regardless of the developer's .env.
process.env.NODE_ENV = 'test';
process.env.DATA_STORE = 'memory';
process.env.ML_SERVICE_URL = 'http://127.0.0.1:9'; // unreachable on purpose: exercises the fallback
process.env.GEMINI_API_KEY = '';
