import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Envuelve un handler async para que cualquier error que lance se reenvíe al
// error handler central vía next(), eliminando el try/catch repetido en los
// controllers.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
