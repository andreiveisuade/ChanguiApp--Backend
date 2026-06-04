import { calculatePricing, summarizeByRate } from '../../../src/services/pricing.service';

describe('pricing.service', () => {
  describe('calculatePricing', () => {
    it('21%: despeja base imponible e IVA del precio final', () => {
      const result = calculatePricing(1500, 21);
      expect(result.rate).toBe(21);
      expect(result.net_price).toBe(1239.67);
      expect(result.tax_amount).toBe(260.33);
    });

    it('10,5%: alícuota reducida', () => {
      const result = calculatePricing(1105, 10.5);
      expect(result.net_price).toBe(1000);
      expect(result.tax_amount).toBe(105);
    });

    it('0%: exento, la base es igual al precio final', () => {
      const result = calculatePricing(850, 0);
      expect(result.net_price).toBe(850);
      expect(result.tax_amount).toBe(0);
    });

    it('precio 0 devuelve todo en 0', () => {
      const result = calculatePricing(0, 21);
      expect(result.net_price).toBe(0);
      expect(result.tax_amount).toBe(0);
    });
  });

  describe('summarizeByRate', () => {
    it('agrupa por alícuota y ordena descendente', () => {
      const summary = summarizeByRate([
        { lineTotal: 1500, rate: 21 },
        { lineTotal: 1105, rate: 10.5 },
        { lineTotal: 850, rate: 0 },
      ]);

      expect(summary.total).toBe(3455);
      expect(summary.taxes).toHaveLength(3);
      expect(summary.taxes[0].rate).toBe(21);
      expect(summary.taxes[2].rate).toBe(0);

      const iva21 = summary.taxes.find((t) => t.rate === 21)!;
      expect(iva21.label).toBe('IVA 21%');
      expect(iva21.amount).toBe(260.33);

      const iva105 = summary.taxes.find((t) => t.rate === 10.5)!;
      expect(iva105.label).toBe('IVA 10,5%');
      expect(iva105.base).toBe(1000);
    });

    it('acumula renglones de la misma alícuota', () => {
      const summary = summarizeByRate([
        { lineTotal: 1500, rate: 21 },
        { lineTotal: 1500, rate: 21 },
      ]);

      expect(summary.taxes).toHaveLength(1);
      expect(summary.total).toBe(3000);
      expect(summary.taxes[0].base).toBe(2479.34);
    });

    it('lista vacía devuelve todo en 0', () => {
      const summary = summarizeByRate([]);
      expect(summary.total).toBe(0);
      expect(summary.subtotal_net).toBe(0);
      expect(summary.taxes).toHaveLength(0);
    });
  });
});
