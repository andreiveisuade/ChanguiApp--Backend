import type { Request, Response, NextFunction } from 'express';
import { supabaseAuth } from '../config/supabase';

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  // Usar supabaseAuth (instancia separada) para validar el token. Si usaramos
  // supabaseAdmin, supabase-js guardaria internamente el JWT del user como
  // sesion del cliente compartido, y los queries posteriores en repositories
  // perderian el bypass de RLS.
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  req.user = data.user;
  next();
}
