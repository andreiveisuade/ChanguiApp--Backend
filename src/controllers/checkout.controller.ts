import type { Request, Response, NextFunction } from 'express';
import * as checkoutService from '../services/checkout.service';

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await checkoutService.createPreference(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhook(req: Request, res: Response): Promise<void> {
  try {
    await checkoutService.handleWebhook(req.body);
  } catch (err) {
    console.error('Webhook error:', err);
  }
  res.status(200).json({ received: true });
}
