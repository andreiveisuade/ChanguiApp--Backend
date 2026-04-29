import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que valida el header X-Admin-Token contra la variable de entorno ADMIN_TOKEN.
 * Usar exclusivamente en endpoints administrativos (no expuestos en Swagger público).
 */
export function requireAdminToken(req: Request, res: Response, next: NextFunction): void {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.headers['x-admin-token'];

  if (!adminToken) {
    res.status(500).json({ error: 'ADMIN_TOKEN no configurado en el servidor' });
    return;
  }

  if (!provided || provided !== adminToken) {
    res.status(401).json({ error: 'Token de administrador inválido' });
    return;
  }

  next();
}
