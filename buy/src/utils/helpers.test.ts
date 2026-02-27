import {
  formatNPR,
  formatDate,
  formatDateTime,
  getDiscountPercent,
  validateNepalPhone,
  normalizePhone,
  getBestETA,
  getAvailableDeliveryOptions,
  getETA,
  addDaysToDate,
} from './helpers';
import type { Product } from '../types';

// ─── formatNPR ────────────────────────────────────────────────────────────────

describe('formatNPR', () => {
  it('formats zero', () => {
    expect(formatNPR(0)).toBe('NPR 0');
  });

  it('formats a whole number with no decimals', () => {
    expect(formatNPR(500)).toBe('NPR 500');
  });

  it('formats thousands with locale separator', () => {
    // en-NP uses comma as thousands separator
    const result = formatNPR(1000);
    expect(result).toMatch(/NPR.+1.000|NPR.+1,000/); // allow comma or period depending on env
    expect(result).toContain('NPR');
  });

  it('formats large amounts', () => {
    const result = formatNPR(10000);
    expect(result).toContain('NPR');
    expect(result).toContain('10');
  });
});

// ─── formatDate / formatDateTime ─────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a valid ISO string to dd MMM yyyy', () => {
    expect(formatDate('2024-01-15T10:00:00.000Z')).toBe('15 Jan 2024');
  });

  it('returns the original string when given an invalid ISO value', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatDateTime', () => {
  it('formats a valid ISO string to dd MMM yyyy, h:mm a', () => {
    const result = formatDateTime('2024-06-01T14:30:00.000Z');
    expect(result).toMatch(/01 Jun 2024/);
  });

  it('returns the original string when given an invalid ISO value', () => {
    expect(formatDateTime('bad')).toBe('bad');
  });
});

// ─── getDiscountPercent ───────────────────────────────────────────────────────

describe('getDiscountPercent', () => {
  it('returns 0 when price equals mrp (no discount)', () => {
    expect(getDiscountPercent(500, 500)).toBe(0);
  });

  it('returns 0 when price is greater than mrp', () => {
    expect(getDiscountPercent(600, 500)).toBe(0);
  });

  it('calculates 50% discount correctly', () => {
    expect(getDiscountPercent(500, 1000)).toBe(50);
  });

  it('calculates 20% discount correctly', () => {
    expect(getDiscountPercent(400, 500)).toBe(20);
  });

  it('rounds to nearest integer', () => {
    // (999 - 666) / 999 * 100 = 33.33...% → rounds to 33
    expect(getDiscountPercent(666, 999)).toBe(33);
  });

  it('handles a 1% discount correctly', () => {
    expect(getDiscountPercent(990, 1000)).toBe(1);
  });

  it('handles a 100% discount (free item)', () => {
    expect(getDiscountPercent(0, 100)).toBe(100);
  });
});

// ─── validateNepalPhone ───────────────────────────────────────────────────────

describe('validateNepalPhone', () => {
  // Valid numbers — the validator expects the local 10-digit Nepali mobile
  // format (97xxxxxxxx or 98xxxxxxxx) after stripping spaces/hyphens/+.
  it.each([
    ['9841234567', 'plain 98 number'],
    ['9741234567', 'plain 97 number'],
    ['98-4123-4567', 'with hyphens and 98'],
    ['97-4123-4567', 'with hyphens and 97'],
    ['98 4123 4567', 'with spaces'],
  ])('accepts %s (%s)', (phone) => {
    expect(validateNepalPhone(phone)).toBe(true);
  });

  // Invalid numbers
  it.each([
    ['1234567890', 'does not start with 97 or 98'],
    ['984123456', 'too short (9 digits)'],
    ['98412345678', 'too long (11 digits)'],
    ['', 'empty string'],
    ['abcdefghij', 'non-numeric'],
    ['9641234567', 'starts with 96'],
    // International format (+977) is not accepted by this validator — it is
    // designed for the local 10-digit format only.
    ['+9779841234567', 'international +977 prefix not supported'],
  ])('rejects %s (%s)', (phone) => {
    expect(validateNepalPhone(phone)).toBe(false);
  });
});

// ─── normalizePhone ───────────────────────────────────────────────────────────

describe('normalizePhone', () => {
  it('strips spaces', () => {
    expect(normalizePhone('98 4123 4567')).toBe('9841234567');
  });

  it('strips hyphens', () => {
    expect(normalizePhone('984-123-4567')).toBe('9841234567');
  });

  it('strips leading plus', () => {
    expect(normalizePhone('+9779841234567')).toBe('9779841234567');
  });

  it('leaves a clean number unchanged', () => {
    expect(normalizePhone('9841234567')).toBe('9841234567');
  });
});

// ─── addDaysToDate ────────────────────────────────────────────────────────────

describe('addDaysToDate', () => {
  it('adds zero days and returns the same date', () => {
    const d = new Date('2024-01-15');
    expect(addDaysToDate(d, 0).toISOString().startsWith('2024-01-15')).toBe(true);
  });

  it('adds 1 day', () => {
    const d = new Date('2024-01-15');
    expect(addDaysToDate(d, 1).toISOString().startsWith('2024-01-16')).toBe(true);
  });

  it('adds 7 days and wraps across a month boundary', () => {
    const d = new Date('2024-01-28');
    expect(addDaysToDate(d, 7).toISOString().startsWith('2024-02-04')).toBe(true);
  });

  it('does not mutate the original date', () => {
    const d = new Date('2024-01-15');
    addDaysToDate(d, 5);
    expect(d.getDate()).toBe(15);
  });
});

// ─── getETA ───────────────────────────────────────────────────────────────────

describe('getETA', () => {
  it('returns correct ETA for ktm_core same_day', () => {
    expect(getETA('ktm_core', 'same_day')).toBe('Same Day');
  });

  it('returns correct ETA for ktm_core next_day', () => {
    expect(getETA('ktm_core', 'next_day')).toBe('Next Day');
  });

  it('returns correct ETA for rest_nepal standard', () => {
    expect(getETA('rest_nepal', 'standard')).toBe('5–8 Days');
  });

  it('returns fallback string for unknown zone/option', () => {
    expect(getETA('unknown_zone' as any, 'same_day')).toBe('Check availability');
  });
});

// ─── getAvailableDeliveryOptions ─────────────────────────────────────────────

describe('getAvailableDeliveryOptions', () => {
  const baseProduct = {
    isFastDelivery: false,
    codAvailableZones: [],
    variants: [],
  } as unknown as Product;

  it('returns only standard for a non-fast product in ktm_core', () => {
    const opts = getAvailableDeliveryOptions(
      { ...baseProduct, isFastDelivery: false },
      'ktm_core',
    );
    expect(opts).toEqual(['standard']);
  });

  it('returns all options for a fast-delivery product in ktm_core', () => {
    const opts = getAvailableDeliveryOptions(
      { ...baseProduct, isFastDelivery: true },
      'ktm_core',
    );
    expect(opts).toContain('same_day');
    expect(opts).toContain('next_day');
    expect(opts).toContain('standard');
  });

  it('returns only standard for fast-delivery product in rest_nepal (zone limitation)', () => {
    const opts = getAvailableDeliveryOptions(
      { ...baseProduct, isFastDelivery: true },
      'rest_nepal',
    );
    expect(opts).toEqual(['standard']);
  });
});

// ─── getBestETA ───────────────────────────────────────────────────────────────

describe('getBestETA', () => {
  const base = { isFastDelivery: false, codAvailableZones: [], variants: [] } as unknown as Product;

  it('returns "Not available" when no options exist', () => {
    // Create a product in a zone that has no matching delivery options
    const result = getBestETA({ ...base, isFastDelivery: false }, 'unknown_zone' as any);
    expect(result).toBe('Not available');
  });

  it('returns "Same Day" for fast-delivery product in ktm_core (highest priority)', () => {
    expect(getBestETA({ ...base, isFastDelivery: true }, 'ktm_core')).toBe('Same Day');
  });

  it('returns "Next Day" for fast-delivery product in ktm_outer (no same_day)', () => {
    expect(getBestETA({ ...base, isFastDelivery: true }, 'ktm_outer')).toBe('Next Day');
  });

  it('returns standard ETA for non-fast product in ktm_core', () => {
    expect(getBestETA({ ...base, isFastDelivery: false }, 'ktm_core')).toBe('2–3 Days');
  });

  it('returns standard ETA for any product in rest_nepal', () => {
    expect(getBestETA({ ...base, isFastDelivery: true }, 'rest_nepal')).toBe('5–8 Days');
  });
});
