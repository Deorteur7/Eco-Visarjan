import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config, isProduction } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org'],
          'connect-src': ["'self'"],
        },
      },
    }),
  );
  if (config.corsOrigin) {
    app.use(cors({ origin: config.corsOrigin.split(',').map((origin) => origin.trim()) }));
  }
  if (config.env !== 'test') app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', createApiRouter());
  app.use('/api', notFoundHandler);

  // In production the built React app is served by the same server.
  const indexFile = path.join(config.clientDist, 'index.html');
  if (existsSync(indexFile)) {
    app.use(express.static(config.clientDist, { index: false, maxAge: isProduction ? '1h' : 0 }));
    app.get('/{*splat}', (_req, res) => res.sendFile(indexFile));
  }

  app.use(errorHandler);
  return app;
}
