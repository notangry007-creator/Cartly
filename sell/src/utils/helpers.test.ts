import {
  formatNPR,
  formatDate,
  orderStatusLabel,
  orderStatusColor,
  productStatusLabel,
  productStatusColor,
  percentageChange,
} from './helpers';
import { Colors } from '../theme';

describe('formatNPR', () => {
  it('formats zero', () => expect(formatNPR(0)).toBe('NPR 0'));
  it('formats small amount', () => expect(formatNPR(500)).toBe('NPR 500'));
  it('formats thousands', () => expect(formatNPR(1500)).toContain('1,500'));
  it('formats large amount', () => {
    const result = formatNPR(184530);
    expect(result).toContain('NPR');
    expect(result).toContain('530');
  });
});

describe('formatDate', () => {
  it('formats ISO string', () => {
    const result = formatDate('2024-07-29T00:00:00.000Z');
    expect(result).toContain('2024');
    expect(typeof result).toBe('string');
  });
});

describe('orderStatusLabel', () => {
  it('returns correct labels', () => {
    expect(orderStatusLabel('pending')).toBe('Pending');
    expect(orderStatusLabel('confirmed')).toBe('Confirmed');
    expect(orderStatusLabel('processing')).toBe('Processing');
    expect(orderStatusLabel('shipped')).toBe('Shipped');
    expect(orderStatusLabel('delivered')).toBe('Delivered');
    expect(orderStatusLabel('cancelled')).toBe('Cancelled');
    expect(orderStatusLabel('refunded')).toBe('Refunded');
  });
});

describe('orderStatusColor', () => {
  it('returns string colors', () => {
    expect(typeof orderStatusColor('pending')).toBe('string');
    expect(typeof orderStatusColor('delivered')).toBe('string');
    expect(typeof orderStatusColor('cancelled')).toBe('string');
  });

  it('maps statuses to distinct colors', () => {
    const delivered = orderStatusColor('delivered');
    const cancelled = orderStatusColor('cancelled');
    expect(delivered).not.toBe(cancelled);
  });
});

describe('productStatusLabel', () => {
  it('returns correct labels', () => {
    expect(productStatusLabel('active')).toBe('Active');
    expect(productStatusLabel('inactive')).toBe('Inactive');
    expect(productStatusLabel('out_of_stock')).toBe('Out of Stock');
    expect(productStatusLabel('draft')).toBe('Draft');
  });
});

describe('productStatusColor', () => {
  it('active is success color', () => expect(productStatusColor('active')).toBe(Colors.success));
  it('out_of_stock is danger color', () => expect(productStatusColor('out_of_stock')).toBe(Colors.danger));
  it('returns string for all statuses', () => {
    (['active', 'inactive', 'out_of_stock', 'draft'] as const).forEach((s) => {
      expect(typeof productStatusColor(s)).toBe('string');
    });
  });
});

describe('percentageChange', () => {
  it('calculates increase', () => expect(percentageChange(110, 100)).toBe(10));
  it('calculates decrease', () => expect(percentageChange(90, 100)).toBe(-10));
  it('handles zero previous', () => expect(percentageChange(100, 0)).toBe(100));
  it('handles zero current from zero', () => expect(percentageChange(0, 0)).toBe(0));
  it('rounds to integer', () => expect(percentageChange(133, 100)).toBe(33));
});
