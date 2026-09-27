// All amounts are integer paise (₹1 = 100).
const FREE_SHIPPING_MIN = 99900;
const SHIPPING_FEE = 9900;

function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
}

function priceItems(items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

module.exports = { FREE_SHIPPING_MIN, SHIPPING_FEE, shippingFor, priceItems };
