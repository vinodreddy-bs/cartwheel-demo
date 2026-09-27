import { describe, expect, it } from 'vitest';
import { formatDiscount, formatINR, rupeesToPaise, shippingFor } from './money.js';

describe('formatINR', () => {
  it('formats whole rupees without decimals and uses Indian grouping', () => {
    expect(formatINR(99900)).toBe('₹999');
    expect(formatINR(449900)).toBe('₹4,499');
    expect(formatINR(15470000)).toBe('₹1,54,700');
    expect(formatINR(0)).toBe('₹0');
  });
  it('shows two decimals when there are paise', () => {
    expect(formatINR(99950)).toBe('₹999.50');
    expect(formatINR(1)).toBe('₹0.01');
  });
  it('formats a discount with a real minus sign', () => {
    expect(formatDiscount(30000)).toBe('−₹300');
  });
});

describe('shippingFor (SH-01)', () => {
  it('charges ₹99 below ₹999 and is free from ₹999', () => {
    expect(shippingFor(99899)).toBe(9900);
    expect(shippingFor(99900)).toBe(0);
    expect(shippingFor(500000)).toBe(0);
  });
});

describe('rupeesToPaise', () => {
  it.each([['1299', 129900], ['1,299.5', 129950], [' ₹1,299.50 ', 129950], ['0.99', 99], ['499', 49900]])('%j → %i', (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });
  it.each(['', '  ', '-5', '12.345', 'abc', '1.2.3', '0'])('%j → null', (input) => {
    expect(rupeesToPaise(input)).toBeNull();
  });
});
