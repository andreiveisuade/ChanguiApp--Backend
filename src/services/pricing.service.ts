import type { TaxBreakdown, TaxLine, TaxSummary } from '../types/domain';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatRate(rate: number): string {
  const text = Number.isInteger(rate) ? String(rate) : String(rate).replace('.', ',');
  return `IVA ${text}%`;
}

// El precio de Precios Claros es final con IVA incluido (Ley 27.221).
// Despejamos hacia atrás la base imponible y el IVA según la alícuota.
export function calculatePricing(priceFinal: number, ratePct: number): Omit<TaxBreakdown, 'category'> {
  const net = priceFinal / (1 + ratePct / 100);
  return {
    rate: ratePct,
    net_price: round2(net),
    tax_amount: round2(priceFinal - net),
  };
}

// Agrupa renglones por alícuota y arma el desglose de IVA de un conjunto
// (carrito o ticket de compra). El IVA se calcula por renglón y se acumula
// por tasa, que es como se discrimina en una factura con alícuotas mixtas.
export function summarizeByRate(lines: Array<{ lineTotal: number; rate: number }>): TaxSummary {
  const byRate = new Map<number, { base: number; amount: number }>();

  for (const { lineTotal, rate } of lines) {
    const { net_price, tax_amount } = calculatePricing(lineTotal, rate);
    const entry = byRate.get(rate) ?? { base: 0, amount: 0 };
    entry.base += net_price;
    entry.amount += tax_amount;
    byRate.set(rate, entry);
  }

  const taxes: TaxLine[] = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, value]) => ({
      rate,
      label: formatRate(rate),
      base: round2(value.base),
      amount: round2(value.amount),
    }));

  return {
    subtotal_net: round2(taxes.reduce((sum, t) => sum + t.base, 0)),
    taxes,
    total: round2(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
  };
}
