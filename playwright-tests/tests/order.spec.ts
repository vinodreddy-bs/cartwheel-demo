import { meera } from '../data/customer';
import { expect, test } from '../fixtures/test';
import type { OrderPage } from '../pages/OrderPage';

async function expectConfirmation(order: OrderPage) {
  await expect(order.heading).toHaveText('Thank you, Meera!');
  await expect(order.confirmation).toHaveText('Order #1001 is confirmed. Please pay ₹1,047 in cash when it arrives.');
  await expect(order.summary.items).toHaveCount(2);
  await expect(order.summary.item('The Pragmatic Checklist')).toHaveText(/× 1\s*₹499$/);
  await expect(order.summary.item('Steel Water Bottle')).toHaveText(/× 1\s*₹449$/);
  await expect(order.summary.subtotal).toHaveText('₹948');
  await expect(order.summary.shipping).toHaveText('₹99');
  await expect(order.summary.total).toHaveText('₹1,047');
  // The subtotal is below ₹999, but a placed order no longer offers the free-delivery hint.
  await expect(order.summary.freeDeliveryNote).toHaveCount(0);
  // innerText keeps the line breaks between the address lines, so they read as separate words.
  await expect(order.deliveryDetails).toHaveText(
    'Delivering to Meera Iyer 14 Lake View Road, Indiranagar Bengaluru 560038 9876543210',
    { useInnerText: true },
  );
  await expect(order.continueShopping).toBeVisible();
}

test.describe('Order confirmation', { tag: '@order' }, () => {
  test('ORD-001 Verify that the order confirmation shows every item, the shipping charge, the amount to pay and the delivery address, and still shows them after a reload', { tag: '@P1' }, async ({ page, order, storeApi }) => {
    const orderId = await storeApi.placeOrder(meera, { 'The Pragmatic Checklist': 1, 'Steel Water Bottle': 1 });
    expect(orderId).toBe(1001);
    await order.goto(orderId);
    await test.step('on first view', () => expectConfirmation(order));

    await page.reload();
    await test.step('after a reload', () => expectConfirmation(order));
  });
});
