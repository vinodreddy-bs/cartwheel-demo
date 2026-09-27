import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/api.js';
import { applyQuote, daysLeftText, isPromoError, promoLabel, removalMessage, statusLabel, typeLabel } from './promo.js';

const totals = { count: 2, subtotal: 149800, shipping: 0, total: 149800 };

describe('promo helpers', () => {
  it('builds the removal message and the summary label', () => {
    expect(removalMessage('FLAT250', 'Add ₹150 more to use FLAT250.')).toBe('FLAT250 was removed. Add ₹150 more to use FLAT250.');
    expect(promoLabel('WELCOME10', '10% off')).toBe('Promo (WELCOME10 · 10% off)');
  });

  it('applyQuote uses the server quote only when it matches the current cart', () => {
    const quote = { code: 'WELCOME10', shortBenefit: '10% off', subtotal: 149800, discount: 14900, shipping: 0, total: 134900 };
    expect(applyQuote(totals, quote)).toEqual({ subtotal: 149800, discount: 14900, shipping: 0, total: 134900, promoLabel: 'Promo (WELCOME10 · 10% off)' });
    expect(applyQuote({ ...totals, subtotal: 99900, total: 99900 }, quote)).toEqual({ subtotal: 99900, discount: 0, shipping: 0, total: 99900, promoLabel: null });
    expect(applyQuote(totals, null)).toEqual({ subtotal: 149800, discount: 0, shipping: 0, total: 149800, promoLabel: null });
  });

  it('labels statuses, types and days left', () => {
    expect(['active', 'not_started', 'expired', 'limit_reached'].map(statusLabel)).toEqual(['Active', 'Not started', 'Expired', 'Limit reached']);
    expect(['percentage', 'flat', 'free_shipping', 'category'].map(typeLabel)).toEqual(['Percentage', 'Flat discount', 'Free shipping', 'Category']);
    expect([0, 1, 7, 8, null].map(daysLeftText)).toEqual(['Ends today', 'Ends in 1 day', 'Ends in 7 days', null, null]);
  });

  it('recognises promo errors from the API only', () => {
    expect(isPromoError(new ApiError('x', 422, { errorCode: 'PROMO_MIN_ORDER', message: 'x' }))).toBe(true);
    expect(isPromoError(new ApiError('Only 3 left', 409, { error: 'Only 3 left' }))).toBe(false);
    expect(isPromoError(new TypeError('scrollIntoViewIfNeeded is not a function'))).toBe(false);
  });
});
