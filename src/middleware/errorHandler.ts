import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';

// Error handler global. Mapea errores comunes a respuestas amigables.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 1. Body JSON malformado (express.json setea err.type)
  if (err?.type === 'entity.parse.failed') {
    console.error(`[ERROR] 400 - JSON malformado: ${err.message}`);
    res.status(400).json({
      error: 'JSON malformado en el body. Verificá comillas, comas y llaves.',
    });
    return;
  }

  // 2. Body demasiado grande
  if (err?.type === 'entity.too.large') {
    console.error(`[ERROR] 413 - Body too large`);
    res.status(413).json({ error: 'Body demasiado grande' });
    return;
  }

  // 3. ApiError lanzado por el dominio (404, 401, 403, 400, etc.)
  if (err instanceof ApiError) {
    console.error(`[ERROR] ${err.status} - ${err.message}`);
    res.status(err.status).json({ error: err.message });
    return;
  }

  // 4. Error con status custom (ej: errores de Supabase con status)
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 600) {
    console.error(`[ERROR] ${err.status} - ${err.message}`);
    const safe =
      process.env.NODE_ENV === 'production' && err.status >= 500
        ? 'Error interno del servidor'
        : err.message || 'Error sin descripcion';
    res.status(err.status).json({ error: safe });
    return;
  }

  // 5. Cualquier otro error inesperado: log completo + 500 sin filtrar a prod
  console.error('[ERROR] 500 - Error inesperado:', err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err?.message || 'Error interno del servidor',
  });
};
