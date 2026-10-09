import { z } from 'zod';
import { config } from '../config/index.js';

const { maxIdolHeightFt, maxIdolCount, maxFlowerKg } = config.rules;

export const materialSchema = z.enum(['CLAY', 'PLASTER_OF_PARIS', 'UNKNOWN']);
const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);
const heightFt = z.coerce.number().min(0.5).max(maxIdolHeightFt);

export const classifyBodySchema = z.object({ heightFt });

export const optionsBodySchema = z.object({ material: materialSchema, heightFt });

export const immersionQuerySchema = z.object({
  lat: lat.optional(),
  lng: lng.optional(),
  material: materialSchema.optional(),
  heightFt: heightFt.optional(),
  maxDistanceKm: z.coerce.number().min(0.5).max(200).optional(),
  includeDemo: z.stringbool().optional(),
  onlySuitable: z.stringbool().optional(),
  type: z.enum(['NATURAL_LAKE', 'ARTIFICIAL_POND']).optional(),
});

export const flowerQuerySchema = z.object({
  lat: lat.optional(),
  lng: lng.optional(),
  maxDistanceKm: z.coerce.number().min(0.5).max(200).optional(),
  includeDemo: z.stringbool().optional(),
});

export const recommendationBodySchema = z.object({
  lat,
  lng,
  material: materialSchema,
  heightFt,
});

export const routeQuerySchema = z.object({
  fromLat: lat,
  fromLng: lng,
  toLat: lat,
  toLng: lng,
});

export const pollutionBodySchema = z.object({
  idolCount: z.coerce.number().int().min(0).max(5000),
  material: materialSchema,
  heightFt,
  flowerKg: z.coerce.number().min(0).max(5000).optional(),
  waterBodyType: z.enum(['NATURAL_LAKE', 'ARTIFICIAL_POND', 'HOME_CONTAINER']).optional(),
  baselineBodMgL: z.coerce.number().min(0).max(200).optional(),
  baselineDoMgL: z.coerce.number().min(0).max(20).optional(),
});

const idolFields = {
  idolCount: z.coerce.number().int().min(1).max(maxIdolCount),
  material: materialSchema,
  heightFt,
};

export const activityBodySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HOME_IMMERSION'), ...idolFields }),
  z.object({
    type: z.literal('DESIGNATED_GUIDED'),
    ...idolFields,
    destinationId: z.string().min(1).max(100),
  }),
  z.object({
    type: z.literal('FLOWER_DISPOSAL'),
    destinationId: z.string().min(1).max(100),
    flowerKg: z.coerce.number().min(0.1).max(maxFlowerKg),
  }),
]);
