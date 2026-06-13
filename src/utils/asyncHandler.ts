import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Envuelve un handler async para que cualquier error que lance se reenvíe al
// error handler central vía next(), eliminando el try/catch repetido en los
// controllers. El genérico Req permite tipar el request (p. ej. AuthedRequest
// detrás de authMiddleware) sin non-null assertions en cada handler.
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
