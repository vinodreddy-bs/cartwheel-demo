const { formatINR } = require('../lib/money');
const { daysBetween, formatPromoDate, istDate } = require('./dates');

function promoStatus(promo, now, usesSoFar) {
  const today = istDate(now);
  if (promo.startsOn && today < promo.startsOn) return 'not_started';
  if (promo.endsOn && today > promo.endsOn) return 'expired';
  if (promo.usageLimit !== null && usesSoFar >= promo.usageLimit) return 'limit_reached';
  return 'active';
}

function describePromo(promo) {
  const shortBenefit = {
    percentage: `${promo.value}% off`,
    flat: `${formatINR(promo.value)} off`,
    free_shipping: 'Free shipping',
    category: `${promo.value}% off ${promo.category}`,
  }[promo.type];
  const benefit = promo.maxDiscount ? `${shortBenefit}, up to ${formatINR(promo.maxDiscount)}` : shortBenefit;
  const conditions = [];
  if (promo.minOrder) conditions.push(`Min. order ${formatINR(promo.minOrder)}`);
  if (promo.type === 'category') conditions.push(`${promo.category} items only`);
  if (promo.startsOn && promo.endsOn) conditions.push(`Valid ${formatPromoDate(promo.startsOn)} – ${formatPromoDate(promo.endsOn)}`);
  if (promo.oncePerEmail) conditions.push('Once per customer');
  if (promo.usageLimit) conditions.push(`Limited to ${promo.usageLimit} uses`);
  if (conditions.length === 0) conditions.push('No minimum order');
  return { benefit, shortBenefit, conditions };
}

function promoView(promo, now, usesSoFar) {
  const status = promoStatus(promo, now, usesSoFar);
  const { code, type, value, minOrder, maxDiscount, category, startsOn, endsOn } = promo;
  return {
    code, type, value, minOrder, maxDiscount, category, startsOn, endsOn, status,
    daysLeft: endsOn && status === 'active' ? daysBetween(istDate(now), endsOn) : null,
    ...describePromo(promo),
  };
}

module.exports = { promoStatus, describePromo, promoView };
