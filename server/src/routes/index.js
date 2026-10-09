import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { getStore } from '../db/index.js';
import { validate } from '../middleware/validate.js';
import { AppError, badRequest } from '../utils/errors.js';
import { classifyIdol } from '../services/geminiService.js';
import { assessOptions } from '../services/idolService.js';
import { getDestination, listFlowerPoints, listImmersionPoints, listWaterBodies } from '../services/locationService.js';
import { recommend } from '../services/recommendationService.js';
import { getRoute } from '../services/routingService.js';
import { mlHealth, predict } from '../services/pollutionService.js';
import { recordActivity } from '../services/activityService.js';
import { getDashboard } from '../services/dashboardService.js';
import {
  activityBodySchema,
  classifyBodySchema,
  flowerQuerySchema,
  immersionQuerySchema,
  optionsBodySchema,
  pollutionBodySchema,
  recommendationBodySchema,
  routeQuerySchema,
} from './schemas.js';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 4 },
});

const limiter = (limit, windowMs = 60_000) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.' } },
  });

/** Detects the real image type from file signature bytes (not the client-supplied header). */
export function detectImageType(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export function createApiRouter() {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const [store, ml] = await Promise.all([getStore().health(), mlHealth()]);
    res.json({
      status: store.ok ? 'ok' : 'degraded',
      dataStore: store,
      mlService: ml,
      geminiConfigured: Boolean(config.gemini.apiKey),
      routing: config.routing.orsApiKey ? 'OpenRouteService with OSRM fallback' : 'OSRM',
    });
  });

  // --- Step 1: identify the idol ---
  router.post(
    '/idol/classify',
    limiter(12),
    upload.single('image'),
    validate(classifyBodySchema),
    async (req, res) => {
      if (!req.file) throw badRequest('Please attach a photo of the idol.', undefined, 'IMAGE_REQUIRED');
      const mimeType = detectImageType(req.file.buffer);
      if (!mimeType) {
        throw new AppError(415, 'UNSUPPORTED_IMAGE', 'Please upload a JPEG, PNG or WebP photo.');
      }
      const classification = await classifyIdol({ buffer: req.file.buffer, mimeType });
      const { heightFt } = req.valid.body;
      res.json({
        classification,
        heightFt,
        options: assessOptions({ material: classification.material, heightFt }),
      });
    },
  );

  router.post('/idol/options', validate(optionsBodySchema), (req, res) => {
    res.json(assessOptions(req.valid.body));
  });

  // --- Step 3: map data ---
  router.get('/immersion-points', validate(immersionQuerySchema, 'query'), async (req, res) => {
    const items = await listImmersionPoints(req.valid.query);
    res.json({ items, meta: { count: items.length, store: getStore().kind } });
  });

  router.get('/flower-points', validate(flowerQuerySchema, 'query'), async (req, res) => {
    const items = await listFlowerPoints(req.valid.query);
    res.json({ items, meta: { count: items.length, store: getStore().kind } });
  });

  router.get('/water-bodies', (_req, res) => {
    res.json(listWaterBodies());
  });

  router.post('/recommendation', limiter(60), validate(recommendationBodySchema), async (req, res) => {
    res.json(await recommend(req.valid.body));
  });

  // --- Step 4: directions ---
  router.get('/route', limiter(60), validate(routeQuerySchema, 'query'), async (req, res) => {
    const { fromLat, fromLng, toLat, toLng } = req.valid.query;
    res.json(await getRoute({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng }));
  });

  // --- Pollution risk ---
  router.post('/pollution/predict', limiter(60), validate(pollutionBodySchema), async (req, res) => {
    res.json(await predict(req.valid.body));
  });

  // --- Activity + dashboard ---
  router.post('/activity', limiter(30), validate(activityBodySchema), async (req, res) => {
    const entry = req.valid.body;
    if (entry.type === 'FLOWER_DISPOSAL') {
      await getDestination('flower', entry.destinationId);
      const record = await recordActivity(entry);
      return res.status(201).json({ id: record.id });
    }
    if (entry.type === 'DESIGNATED_GUIDED') {
      const point = await getDestination('immersion', entry.destinationId);
      const record = await recordActivity({ ...entry, destinationIsArtificial: Boolean(point.isArtificialPond) });
      return res.status(201).json({ id: record.id });
    }
    const record = await recordActivity(entry);
    return res.status(201).json({ id: record.id });
  });

  router.get('/dashboard', async (_req, res) => {
    res.json(await getDashboard());
  });

  return router;
}
