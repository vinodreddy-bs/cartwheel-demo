// All amounts are integer paise (₹1 = 100). Keep in sync with server/lib/money.js.
export const FREE_SHIPPING_MIN = 99900;
export const SHIPPING_FEE = 9900;

const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatINR(paise) {
  return paise % 100 === 0 ? whole.format(paise / 100) : exact.format(paise / 100);
}

export function formatDiscount(paise) {
  return `−${formatINR(paise)}`;
}

export function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
}

export function rupeesToPaise(input) {
  const clean = String(input).replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, frac = ''] = clean.split('.');
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return paise > 0 ? paise : null;
}
