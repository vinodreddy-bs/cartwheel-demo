import { ApiError } from '../services/api.js';

export const GENERIC_PROMO_ERROR = "Couldn't apply code. Please try again.";

export function isPromoError(err) {
  return err instanceof ApiError && typeof err.body?.errorCode === 'string';
}

export function removalMessage(code, message) {
  return `${code} was removed. ${message}`;
}

export function promoLabel(code, shortBenefit) {
  return `Promo (${code} · ${shortBenefit})`;
}

export function applyQuote(totals, quote) {
  if (!quote || quote.subtotal !== totals.subtotal) {
    return { subtotal: totals.subtotal, discount: 0, shipping: totals.shipping, total: totals.total, promoLabel: null };
  }
  return {
    subtotal: quote.subtotal, discount: quote.discount, shipping: quote.shipping, total: quote.total,
    promoLabel: promoLabel(quote.code, quote.shortBenefit),
  };
}

const STATUS = { active: 'Active', not_started: 'Not started', expired: 'Expired', limit_reached: 'Limit reached' };
const TYPES = { percentage: 'Percentage', flat: 'Flat discount', free_shipping: 'Free shipping', category: 'Category' };

export const statusLabel = (status) => STATUS[status] ?? status;
export const typeLabel = (type) => TYPES[type] ?? type;

export function daysLeftText(daysLeft) {
  if (daysLeft === null || daysLeft === undefined || daysLeft > 7) return null;
  if (daysLeft === 0) return 'Ends today';
  return `Ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
}
