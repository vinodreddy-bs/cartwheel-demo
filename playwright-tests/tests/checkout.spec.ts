import type { Customer } from '../data/customer';
import { kabir, meera } from '../data/customer';
import { expect, test } from '../fixtures/test';

const FIELD_MESSAGES: Record<keyof Customer, string> = {
  name: 'Enter your full name',
  email: 'Enter a valid email address',
  phone: 'Enter a valid 10-digit mobile number',
  address: 'Enter your street address',
  city: 'Enter your city',
  pin: 'Enter a valid 6-digit PIN code',
};
const FIELDS = Object.keys(FIELD_MESSAGES) as (keyof Customer)[];

// CHK-002 step 2: the invalid values, and the corrections that step 3 makes.
const INVALID: Partial<Customer> = { email: 'meera@example', phone: '12345', pin: '012345' };
const CORRECTED: Partial<Customer> = { email: 'meera@example.com', phone: '98765 43210', pin: '560038' };

test.describe('Checkout', { tag: '@checkout' }, () => {
  test('CHK-001 Verify that user can place a cash-on-delivery order with valid details, sees it confirmed and finds the cart empty afterwards', { tag: '@P0' }, async ({ page, seedCart, cart, checkout, order, header }) => {
    await seedCart({ 'Steel Water Bottle': 1 });
    await cart.goto();
    await cart.checkoutLink.click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkout.summary.items).toHaveCount(1);
    await expect(checkout.summary.item('Steel Water Bottle')).toHaveText(/× 1\s*₹449$/);
    await expect(checkout.summary.subtotal).toHaveText('₹449');
    await expect(checkout.summary.shipping).toHaveText('₹99');
    await expect(checkout.summary.total).toHaveText('₹548');
    await expect(checkout.cashOnDelivery).toBeChecked();

    await checkout.fillDetails(meera);
    await checkout.placeOrder.click();
    await expect(page).toHaveURL(/\/order\/1001$/);
    await expect(order.heading).toHaveText('Thank you, Meera!');
    await expect(order.confirmation).toHaveText('Order #1001 is confirmed. Please pay ₹548 in cash when it arrives.');
    await expect(header.cartLink).toHaveAccessibleName('Cart, 0 items');

    await header.cartLink.click();
    await expect(cart.heading).toHaveText('Your cart is empty');
  });

  test('CHK-002 Verify that user cannot place an order while any delivery detail is missing or invalid, and is shown which fields to fix', { tag: '@P0' }, async ({ page, seedCart, checkout, order, storeApi }) => {
    await seedCart({ 'Steel Water Bottle': 1 });
    await checkout.goto();

    await test.step('every field empty', async () => {
      await checkout.placeOrder.click();
      await expect(page).toHaveURL(/\/checkout$/);
      for (const key of FIELDS) {
        await expect(checkout.field(key)).toHaveAttribute('aria-invalid', 'true');
        await expect(checkout.field(key)).toHaveAccessibleDescription(FIELD_MESSAGES[key]);
      }
      await expect(checkout.field('name')).toBeFocused();
    });

    await test.step('invalid email, mobile number and PIN code', async () => {
      await checkout.fillDetails({ ...meera, ...INVALID });
      await checkout.placeOrder.click();
      await expect(page).toHaveURL(/\/checkout$/);
      for (const key of FIELDS) {
        if (key in INVALID) {
          await expect(checkout.field(key)).toHaveAttribute('aria-invalid', 'true');
          await expect(checkout.field(key)).toHaveAccessibleDescription(FIELD_MESSAGES[key]);
        } else {
          await expect(checkout.field(key)).toHaveAttribute('aria-invalid', 'false');
          await expect(checkout.field(key)).toHaveAccessibleDescription('');
        }
      }
      await expect(checkout.field('email')).toBeFocused();
      expect(await storeApi.orderCount()).toBe(0);
    });

    await test.step('corrected details', async () => {
      await checkout.fillDetails(CORRECTED);
      await checkout.placeOrder.click();
      await expect(page).toHaveURL(/\/order\/1001$/);
      await expect(order.confirmation).toContainText('Order #1001 is confirmed.');
      // Spaces in the mobile number are dropped before the order is stored.
      await expect(order.deliveryDetails).toContainText('9876543210');
    });
  });

  test('CHK-003 Verify that user cannot order more units than are left after another shopper buys first, and the cart is corrected to what is available', { tag: '@P1' }, async ({ page, seedCart, cart, checkout, order, storeApi }) => {
    await seedCart({ 'Arc Desk Lamp': 2 });
    await checkout.goto();
    await checkout.fillDetails(meera);

    expect(await storeApi.placeOrder(kabir, { 'Arc Desk Lamp': 2 })).toBe(1001);

    await checkout.placeOrder.click();
    await expect(checkout.error).toHaveText('Only 1 left of Arc Desk Lamp');
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkout.summary.item('Arc Desk Lamp')).toHaveText(/× 1\s*₹1,849$/);
    await expect(checkout.summary.subtotal).toHaveText('₹1,849');
    await expect(checkout.summary.shipping).toHaveText('Free');
    await expect(checkout.summary.total).toHaveText('₹1,849');
    expect(await storeApi.orderCount()).toBe(1);

    await checkout.backToCart.click();
    await expect(cart.notice).toHaveText('Only 1 of Arc Desk Lamp are available, so we updated your cart.');
    await expect(cart.dismissNotice).toBeVisible();
    await expect(cart.quantity('Arc Desk Lamp')).toHaveValue('1');

    await cart.checkoutLink.click();
    await checkout.fillDetails(meera);
    await checkout.placeOrder.click();
    await expect(page).toHaveURL(/\/order\/1002$/);
    await expect(order.confirmation).toHaveText('Order #1002 is confirmed. Please pay ₹1,849 in cash when it arrives.');
  });
});
