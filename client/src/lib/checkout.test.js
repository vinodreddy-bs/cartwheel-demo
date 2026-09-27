import { describe, expect, it } from 'vitest';
import { normalizeCustomer, validateCustomer } from './checkout.js';

const valid = { name: 'Ravi Kumar', email: 'ravi@example.com', phone: '98765 43210', address: '12 MG Road', city: 'Bengaluru', pin: '560038' };

describe('validateCustomer', () => {
  it('accepts a valid customer', () => {
    expect(validateCustomer(valid)).toEqual({});
  });
  it('reports every bad field with the server wording', () => {
    expect(validateCustomer({ name: 'R', email: 'x@', phone: '5123456789', address: 'abc', city: '', pin: '012345' })).toEqual({
      name: 'Enter your full name',
      email: 'Enter a valid email address',
      phone: 'Enter a valid 10-digit mobile number',
      address: 'Enter your street address',
      city: 'Enter your city',
      pin: 'Enter a valid 6-digit PIN code',
    });
  });
  it('normalises spacing, case and phone separators', () => {
    expect(normalizeCustomer({ ...valid, email: ' Ravi@Example.COM ', phone: '98765-43210' })).toMatchObject({ email: 'ravi@example.com', phone: '9876543210' });
  });
});
