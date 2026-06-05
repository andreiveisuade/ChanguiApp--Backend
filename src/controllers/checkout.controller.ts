import type { Request, Response, NextFunction } from 'express';
import * as checkoutService from '../services/checkout.service';

// Solo deep links de la app (build nativo y Expo Go). Evita open-redirect.
const ALLOWED_RETURN_SCHEMES = ['changuiapp://', 'exp://', 'exps://'];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const returnUrl =
      typeof req.body?.returnUrl === 'string' ? req.body.returnUrl : undefined;
    const result = await checkoutService.createPreference(req.user!.id, returnUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Pagina publica a la que Mercado Pago redirige tras el pago (back_url).
 * Reenvia al deep link de la app con preference_id y status para que la app
 * cierre el browser y resuelva la confirmacion. Sin auth: la invoca el browser.
 */
export function returnPage(req: Request, res: Response): void {
  const rt = typeof req.query.rt === 'string' ? req.query.rt : '';
  const preferenceId = typeof req.query.preference_id === 'string' ? req.query.preference_id : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';

  const isAllowed = ALLOWED_RETURN_SCHEMES.some((scheme) => rt.startsWith(scheme));

  if (!isAllowed) {
    res
      .status(200)
      .type('html')
      .send(
        '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>ChanguiApp</title></head><body style="font-family:sans-serif;text-align:center;padding:40px">' +
          '<p>Pago procesado. Ya podés volver a ChanguiApp.</p></body></html>'
      );
    return;
  }

  const params = new URLSearchParams();
  if (preferenceId) params.set('preference_id', preferenceId);
  if (status) params.set('status', status);
  const separator = rt.includes('?') ? '&' : '?';
  const deepLink = `${rt}${separator}${params.toString()}`;

  res
    .status(200)
    .type('html')
    .send(
      '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>Volviendo a ChanguiApp</title></head>' +
        '<body style="font-family:sans-serif;text-align:center;padding:40px">' +
        '<p>Volviendo a ChanguiApp…</p>' +
        `<a href="${escapeHtml(deepLink)}">Abrir ChanguiApp</a>` +
        `<script>window.location.replace(${JSON.stringify(deepLink)});</script>` +
        '</body></html>'
    );
}

export async function status(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const preferenceId =
      typeof req.query.preference_id === 'string' ? req.query.preference_id : '';
    if (!preferenceId) {
      res.status(400).json({ error: 'preference_id requerido' });
      return;
    }
    const result = await checkoutService.getCheckoutStatus(req.user!.id, preferenceId);
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
