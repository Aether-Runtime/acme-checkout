import { describe, expect, it } from 'vitest';
import { formatCents } from '../src/money';

describe('formatCents', () => {
  it('formats cents as dollars with thousands separators', () => {
    expect(formatCents(1234567)).toBe('$12,345.67');
    expect(formatCents(100000000)).toBe('$1,000,000.00');
    expect(formatCents(99999)).toBe('$999.99');
    expect(formatCents(100000)).toBe('$1,000.00');
  });

  it('pads small amounts', () => {
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(5)).toBe('$0.05');
    expect(formatCents(50)).toBe('$0.50');
    expect(formatCents(100)).toBe('$1.00');
  });

  it('puts the sign before the dollar symbol for negative amounts', () => {
    expect(formatCents(-1234567)).toBe('-$12,345.67');
    expect(formatCents(-5)).toBe('-$0.05');
  });

  it('rejects non-integer and non-finite input', () => {
    expect(() => formatCents(12.5)).toThrow(RangeError);
    expect(() => formatCents(Number.NaN)).toThrow(RangeError);
    expect(() => formatCents(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
