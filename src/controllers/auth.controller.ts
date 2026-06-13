import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const data = await authService.register(email, password, name);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
