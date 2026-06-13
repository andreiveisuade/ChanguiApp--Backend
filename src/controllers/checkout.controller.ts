import type { Request, Response } from 'express';
import * as checkoutService from '../services/checkout.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// Deep link de la app al que MP reenvia tras el pago. Constante (config), nunca
// derivado del request: la app ya tiene el preference_id, el deep link solo
// señala "cerrá el browser". Evita reflejar datos del usuario (XSS/open-redirect).
const APP_RETURN_DEEP_LINK =
  process.env.APP_RETURN_DEEP_LINK || 'changuiapp://checkout/return';

export const create = asyncHandler(async (req, res) => {
  const result = await checkoutService.createPreference(req.user!.id);
  res.json(result);
});

/**
 * Pagina publica a la que Mercado Pago redirige tras el pago (back_url).
 * Redirige al deep link constante de la app para que expo-web-browser cierre el
 * browser y la app resuelva la confirmacion. Sin auth: la invoca el browser.
 * No refleja nada del request.
 */
export function returnPage(_req: Request, res: Response): void {
  res.redirect(APP_RETURN_DEEP_LINK);
}

export const status = asyncHandler(async (req, res) => {
  const preferenceId =
    typeof req.query.preference_id === 'string' ? req.query.preference_id : '';
  if (!preferenceId) {
    throw new ApiError('preference_id requerido', 400);
  }
  const result = await checkoutService.getCheckoutStatus(req.user!.id, preferenceId);
  res.json(result);
});

// El webhook de MP siempre debe responder 200, incluso si el procesamiento
// falla, para que MP no lo reintente en loop. Por eso NO usa asyncHandler:
// traga el error a proposito y loguea.
export async function webhook(req: Request, res: Response): Promise<void> {
  try {
    await checkoutService.handleWebhook(req.body);
  } catch (err) {
    console.error('Webhook error:', err);
  }
  res.status(200).json({ received: true });
}
