import rateLimit from 'express-rate-limit';

// Rate limiting global - para todos los endpoints
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 100,                  // máximo 100 requests por IP en esa ventana
  message: 'Demasiadas solicitudes, intenta mas tarde.',
});

// Rate limiting estricto - solo para login y registro
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 10,                   // máximo 10 intentos por IP
  message: 'Demasiados intentos de autenticacion, espera 15 minutos.',
});
