import { calculateShippingFee, getZone, ZONES, DELIVERY_FEE_MAP } from './zones';

// ─── getZone ─────────────────────────────────────────────────────────────────

describe('getZone', () => {
  it('returns the correct zone for each valid id', () => {
    const ids = ['ktm_core', 'ktm_outer', 'major_city', 'rest_nepal'] as const;
    for (const id of ids) {
      const zone = getZone(id);
      expect(zone.id).toBe(id);
    }
  });

  it('falls back to the first zone (ktm_core) for an unknown id', () => {
    const zone = getZone('nonexistent');
    expect(zone.id).toBe('ktm_core');
  });

  it('all zones have the required fields', () => {
    for (const zone of ZONES) {
      expect(typeof zone.id).toBe('string');
      expect(typeof zone.name).toBe('string');
      expect(typeof zone.codAvailable).toBe('boolean');
      expect(typeof zone.codFee).toBe('number');
      expect(typeof zone.shippingBase).toBe('number');
      expect(Array.isArray(zone.deliveryOptions)).toBe(true);
      expect(zone.deliveryOptions.length).toBeGreaterThan(0);
    }
  });

  it('rest_nepal does not offer COD', () => {
    expect(getZone('rest_nepal').codAvailable).toBe(false);
  });

  it('ktm_core offers COD with no fee', () => {
    const zone = getZone('ktm_core');
    expect(zone.codAvailable).toBe(true);
    expect(zone.codFee).toBe(0);
  });
});

// ─── calculateShippingFee ─────────────────────────────────────────────────────

describe('calculateShippingFee', () => {
  // No weight surcharge cases (weight ≤ 1 kg)

  it('returns the exact base fee for a 0 kg item in ktm_core standard', () => {
    expect(calculateShippingFee('ktm_core', 'standard', 0)).toBe(60);
  });

  it('returns the exact base fee for a 1 kg item (no surcharge threshold)', () => {
    expect(calculateShippingFee('ktm_core', 'standard', 1)).toBe(60);
  });

  it('returns same-day base fee for ktm_core', () => {
    expect(calculateShippingFee('ktm_core', 'same_day', 0)).toBe(150);
  });

  it('returns next-day base fee for ktm_outer', () => {
    expect(calculateShippingFee('ktm_outer', 'next_day', 0)).toBe(100);
  });

  it('returns standard base fee for rest_nepal', () => {
    expect(calculateShippingFee('rest_nepal', 'standard', 0)).toBe(200);
  });

  // Weight surcharge cases (weight > 1 kg)
  // Formula: baseFee + (weightKg - 1) * baseFee * 0.1, rounded

  it('applies weight surcharge for a 2 kg item in ktm_core standard', () => {
    // base=60, surcharge=(2-1)*60*0.1=6, total=66
    expect(calculateShippingFee('ktm_core', 'standard', 2)).toBe(66);
  });

  it('applies weight surcharge for a 3 kg item in ktm_core same_day', () => {
    // base=150, surcharge=(3-1)*150*0.1=30, total=180
    expect(calculateShippingFee('ktm_core', 'same_day', 3)).toBe(180);
  });

  it('applies weight surcharge for a 5 kg item in rest_nepal standard', () => {
    // base=200, surcharge=(5-1)*200*0.1=80, total=280
    expect(calculateShippingFee('rest_nepal', 'standard', 5)).toBe(280);
  });

  it('rounds fractional surcharges to the nearest integer', () => {
    // base=60, surcharge=(1.5-1)*60*0.1=3, total=63
    expect(calculateShippingFee('ktm_core', 'standard', 1.5)).toBe(63);
  });

  // Fallback case

  it('returns 200 (fallback) for an unknown zone', () => {
    expect(calculateShippingFee('unknown_zone', 'standard', 1)).toBe(200);
  });

  it('returns 200 (fallback) for a known zone but unknown delivery option', () => {
    expect(calculateShippingFee('ktm_core', 'express_12h', 1)).toBe(200);
  });

  // Edge cases

  it('handles fractional weight below 1 kg (no surcharge)', () => {
    expect(calculateShippingFee('ktm_core', 'standard', 0.5)).toBe(60);
  });

  it('produces a result consistent with DELIVERY_FEE_MAP for all zone/option combos', () => {
    for (const [zoneId, options] of Object.entries(DELIVERY_FEE_MAP)) {
      for (const [option, baseFee] of Object.entries(options)) {
        // At weight=1, fee must equal exactly baseFee (no surcharge)
        expect(calculateShippingFee(zoneId, option, 1)).toBe(baseFee);
      }
    }
  });
});
