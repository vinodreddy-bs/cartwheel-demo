import { expect, test } from '../fixtures/test';

test.describe('Promo codes', { tag: '@promo' }, () => {
  test(
    'PROMO-001 Verify that user can apply a valid percentage-off code meeting the minimum order',
    { tag: '@P1' },
    async ({ page, seedCart, cart }) => {
      // Cart: Pulse Wireless Earbuds (₹999) + The Pragmatic Checklist (₹499) = ₹1,498
      await seedCart({ 'Pulse Wireless Earbuds': 1, 'The Pragmatic Checklist': 1 });
      await cart.goto();

      // Apply ' welcome10 ' — spaces and mixed case must be accepted (spec rule 1)
      await cart.applyPromo(' welcome10 ');

      // Success message via role=status (data-testid="promo-message", observed step 12)
      await expect(cart.promoMessage).toHaveText('WELCOME10 applied. You saved ₹149.');

      // Promo row label in summary (exact text observed in browsing history step 14)
      await expect(page.getByText('Promo (WELCOME10 · 10% off)')).toBeVisible();
      // Discount value (data-testid="summary-discount", observed step 13)
      await expect(cart.summary.discount).toHaveText('−₹149');

      // Totals: subtotal unchanged, shipping free (≥₹999 before discount), total = 1498 − 149
      await expect(cart.summary.subtotal).toHaveText('₹1,498');
      await expect(cart.summary.shipping).toHaveText('Free');
      await expect(cart.summary.total).toHaveText('₹1,349');
    },
  );

  test(
    'PROMO-003 Verify that WELCOME10 applies at exactly the minimum order boundary (₹999)',
    { tag: '@P1' },
    async ({ seedCart, cart }) => {
      // Cart: Pulse Wireless Earbuds = ₹999 exactly (the minimum for WELCOME10)
      await seedCart({ 'Pulse Wireless Earbuds': 1 });
      await cart.goto();

      await cart.applyPromo('WELCOME10');

      // 10% of ₹999 = ₹99.9 → rounded down to ₹99 (spec rule 8)
      await expect(cart.promoMessage).toHaveText('WELCOME10 applied. You saved ₹99.');
      await expect(cart.summary.discount).toHaveText('−₹99');

      // Shipping is free (subtotal ≥ ₹999 before discount); total = 999 − 99 = 900
      await expect(cart.summary.shipping).toHaveText('Free');
      await expect(cart.summary.total).toHaveText('₹900');
    },
  );

  test(
    'PROMO-004 Verify that FREESHIP removes shipping charge and reports correct saving',
    { tag: '@P1' },
    async ({ seedCart, cart }) => {
      // Cart: Stoneware Mug Set (₹649) — subtotal below ₹999 so shipping is ₹99
      await seedCart({ 'Stoneware Mug Set (4)': 1 });
      await cart.goto();

      // Confirm shipping is ₹99 before applying the code
      await expect(cart.summary.shipping).toHaveText('₹99');

      await cart.applyPromo('FREESHIP');

      // Shipping becomes free; saving = ₹99 (the shipping charge removed)
      await expect(cart.promoMessage).toHaveText('FREESHIP applied. You saved ₹99.');
      await expect(cart.summary.shipping).toHaveText('Free');

      // Total = subtotal only (no discount row, no shipping); 649 − 0 + 0 = 649
      await expect(cart.summary.subtotal).toHaveText('₹649');
      await expect(cart.summary.total).toHaveText('₹649');
    },
  );
});
