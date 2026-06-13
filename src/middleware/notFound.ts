import type { Request, Response } from 'express';

// 404 handler para rutas no encontradas. Si llegamos aca es porque
// ningun router previo matcheo el path.
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    method: req.method,
    path: req.path,
  });
}
