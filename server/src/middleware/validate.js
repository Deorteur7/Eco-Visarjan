import { badRequest } from '../utils/errors.js';

/** Validates req[source] with a zod schema; the parsed value is stored on req.valid[source]. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    return next(badRequest('Some inputs are invalid.', details, 'VALIDATION_ERROR'));
  }
  req.valid = { ...req.valid, [source]: result.data };
  return next();
};
