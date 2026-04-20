import type { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await userService.getProfile(req.user!.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await userService.updateProfile(req.user!.id, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function deleteProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await userService.deleteProfile(req.user!.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}
