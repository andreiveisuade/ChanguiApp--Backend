import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import * as checkoutService from '../services/checkout.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthedRequest } from '../types/http';

// Deep link de la app al que MP reenvia tras el pago. Constante (config), nunca
// derivado del request: la app ya tiene el preference_id, el deep link solo
// señala "cerrá el browser". Evita reflejar datos del usuario (XSS/open-redirect).
const APP_RETURN_DEEP_LINK =
  process.env.APP_RETURN_DEEP_LINK || 'changuiapp://checkout/return';

export const create = asyncHandler<AuthedRequest>(async (req, res) => {
  const result = await checkoutService.createPreference(req.user.id);
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

export const status = asyncHandler<AuthedRequest>(async (req, res) => {
  const preferenceId =
    typeof req.query.preference_id === 'string' ? req.query.preference_id : '';
  if (!preferenceId) {
    throw new ApiError('preference_id requerido', 400);
  }
  const result = await checkoutService.getCheckoutStatus(req.user.id, preferenceId);
  res.json(result);
});

// Verifica la firma del webhook de MP (header "x-signature: ts=...,v1=...").
// Manifest oficial: id:<data.id>;request-id:<x-request-id>;ts:<ts>; firmado con
// HMAC-SHA256 y MP_WEBHOOK_SECRET (clave secreta de la integración en el panel MP).
// Sin secret: en producción falla cerrado; en dev/test bypassa con warning
// (mismo criterio "falla cerrado" que assertTestCredentials del service).
function verifyMpSignature(req: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    console.warn('MP_WEBHOOK_SECRET no seteado: firma del webhook NO verificada (modo dev)');
    return true;
  }

  const xSignature = req.header('x-signature');
  if (!xSignature) return false;
  const xRequestId = req.header('x-request-id');
  // data.id viene en el query string de la URL de notificación (?data.id=...).
  const dataId =
    typeof req.query['data.id'] === 'string' ? (req.query['data.id'] as string) : undefined;

  // x-signature = "ts=<unix>,v1=<hmac_hex>"
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=');
    if (key?.trim() === 'ts') ts = value?.trim();
    else if (key?.trim() === 'v1') v1 = value?.trim();
  }
  if (!ts || !v1) return false;

  // Manifest: se omite el segmento de los valores ausentes; data.id en minúscula.
  let manifest = '';
  if (dataId) manifest += `id:${dataId.toLowerCase()};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(v1, 'hex');
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// El webhook responde 200 ante errores de PROCESAMIENTO (para que MP no reintente
// en loop). La firma se valida antes: si es inválida o ausente → 401 y no procesa.
export async function webhook(req: Request, res: Response): Promise<void> {
  if (!verifyMpSignature(req)) {
    console.warn('Webhook MP: firma inválida o ausente, ignorado');
    res.status(401).json({ error: 'invalid signature' });
    return;
  }
  try {
    await checkoutService.handleWebhook(req.body);
  } catch (err) {
    console.error('Webhook error:', err);
  }
  res.status(200).json({ received: true });
}
