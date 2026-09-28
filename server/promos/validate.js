const { formatINR } = require('../lib/money');
const { calculateDiscount } = require('./calculate');
const { formatPromoDate, istDate } = require('./dates');

const CODE_RE = /^[A-Z0-9]{3,20}$/;

function normalizeCode(raw) {
  return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

function usesOf(store, code) {
  return store.promoUses.filter((u) => u.code === code).length;
}

const fail = (status, errorCode, message, extra = {}) => ({ ok: false, status, errorCode, message, ...extra });

function validatePromo({ store, now, rawCode, items, email }) {
  const code = normalizeCode(rawCode);
  if (!CODE_RE.test(code)) return fail(400, 'PROMO_INVALID_FORMAT', 'Promo codes contain only letters and numbers.');

  const promo = store.promos.find((p) => p.code === code);
  if (!promo) return fail(404, 'PROMO_NOT_FOUND', `We couldn't find the code ${code}.`);

  const today = istDate(now);
  if (promo.startsOn && today < promo.startsOn) return fail(422, 'PROMO_NOT_STARTED', `${code} starts on ${formatPromoDate(promo.startsOn)}.`);
  if (promo.endsOn && today > promo.endsOn) return fail(422, 'PROMO_EXPIRED', `${code} expired on ${formatPromoDate(promo.endsOn)}.`);

  if (promo.usageLimit !== null && usesOf(store, code) >= promo.usageLimit) {
    return fail(422, 'PROMO_LIMIT_REACHED', `${code} has reached its usage limit.`);
  }
  if (email && promo.oncePerEmail && store.promoUses.some((u) => u.code === code && u.email === email.toLowerCase())) {
    return fail(422, 'PROMO_ALREADY_USED', `${code} has already been used with this email.`);
  }

  if (items.length === 0) return fail(422, 'PROMO_EMPTY_CART', 'Add items to your cart to use a promo code.');

  const { subtotal, eligible } = calculateDiscount(promo, items);
  if (promo.minOrder !== null && subtotal < promo.minOrder) {
    const shortfall = promo.minOrder - subtotal;
    return fail(422, 'PROMO_MIN_ORDER', `Add ${formatINR(shortfall)} more to use ${code}.`, { shortfall });
  }
  if (promo.type === 'category' && eligible === 0) {
    return fail(422, 'PROMO_NOT_APPLICABLE', `${code} isn't valid for items in your cart.`);
  }

  return { ok: true, promo, code };
}

function promoErrorBody({ errorCode, message, shortfall }) {
  return shortfall === undefined ? { errorCode, message } : { errorCode, message, shortfall };
}

module.exports = { CODE_RE, normalizeCode, usesOf, validatePromo, promoErrorBody };
