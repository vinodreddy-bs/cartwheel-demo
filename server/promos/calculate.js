const { formatINR, shippingFor } = require('../lib/money');

const floorToRupee = (paise) => Math.floor(paise / 100) * 100;

function calculateDiscount(promo, items) {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const eligible = promo.type === 'category'
    ? items.filter((i) => i.category === promo.category).reduce((sum, i) => sum + i.lineTotal, 0)
    : subtotal;

  let discount = 0;
  if (promo.type === 'percentage') {
    discount = (subtotal * promo.value) / 100;
    if (promo.maxDiscountAmount) discount = Math.min(discount, promo.maxDiscountAmount);
  } else if (promo.type === 'category') {
    discount = (eligible * promo.value) / 100;
  } else if (promo.type === 'flat') {
    discount = promo.value;
  }
  return { subtotal, eligible, discount: Math.min(floorToRupee(discount), eligible) };
}

function quotePromo(promo, items) {
  const { subtotal, discount } = calculateDiscount(promo, items);
  const baseShipping = shippingFor(subtotal);
  const shipping = promo.type === 'free_shipping' ? 0 : baseShipping;
  return { subtotal, discount, shipping, baseShipping, total: subtotal - discount + shipping, savings: discount + baseShipping - shipping };
}

function appliedMessage(code, promo, quote) {
  if (promo.type === 'free_shipping' && quote.baseShipping === 0) return `${code} applied. Your order already ships free.`;
  return `${code} applied. You saved ${formatINR(quote.savings)}.`;
}

module.exports = { calculateDiscount, quotePromo, appliedMessage };
