import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password y name son obligatorios' });
      return;
    }

    const data = await authService.register(email, password, name);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y password son obligatorios' });
      return;
    }
    const data = await authService.login(email, password);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
  }
};