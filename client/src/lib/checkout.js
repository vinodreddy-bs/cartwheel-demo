// Same rules and wording as server/routes/orders.js validateCustomer.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMPTY_CUSTOMER = { name: '', email: '', phone: '', address: '', city: '', pin: '' };

export function normalizeCustomer(form) {
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  return {
    name: str(form.name), email: str(form.email).toLowerCase(), phone: str(form.phone).replace(/[\s-]/g, ''),
    address: str(form.address), city: str(form.city), pin: str(form.pin),
  };
}

export function validateCustomer(form) {
  const c = normalizeCustomer(form);
  const fields = {};
  if (c.name.length < 2) fields.name = 'Enter your full name';
  if (!EMAIL_RE.test(c.email)) fields.email = 'Enter a valid email address';
  if (!/^[6-9]\d{9}$/.test(c.phone)) fields.phone = 'Enter a valid 10-digit mobile number';
  if (c.address.length < 5) fields.address = 'Enter your street address';
  if (c.city.length < 2) fields.city = 'Enter your city';
  if (!/^[1-9]\d{5}$/.test(c.pin)) fields.pin = 'Enter a valid 6-digit PIN code';
  return fields;
}
