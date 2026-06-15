import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000; // ventana de 15 minutos
const GLOBAL_MAX = 100; // requests por IP por ventana (toda la API)
const AUTH_MAX = 10; // intentos por IP por ventana (login/registro)

// Rate limiting global - para todos los endpoints
export const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: GLOBAL_MAX,
  message: 'Demasiadas solicitudes, intenta mas tarde.',
  // /health lo pingean el health check de Render y el keep-warm de forma
  // frecuente; no debe contar para el rate limit ni devolver 429, o Render
  // marca la instancia como failed y tira el backend.
  skip: (req) => req.path === '/health',
});

// Rate limiting estricto - solo para login y registro
export const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: AUTH_MAX,
  message: 'Demasiados intentos de autenticacion, espera 15 minutos.',
});
