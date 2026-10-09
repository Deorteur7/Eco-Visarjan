/** An error that carries an HTTP status and a stable machine-readable code. */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details, code = 'BAD_REQUEST') =>
  new AppError(400, code, message, details);
export const notFound = (message) => new AppError(404, 'NOT_FOUND', message);
export const unavailable = (code, message) => new AppError(503, code, message);
