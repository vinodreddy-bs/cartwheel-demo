import percySnapshot from '@percy/playwright';
import { productIds } from '../data/catalogue';
import { meera } from '../data/customer';
import { expect, test } from '../fixtures/test';

// Visual snapshots for Percy. Run with `npm run test:visual`, which starts Percy around
// the run. Outside `percy exec`, percySnapshot logs that Percy is not running and does nothing.
//
// Each title starts with the ID of the manual case whose screen it snapshots. The behaviour itself is
// asserted by that case's test in its own spec; these only guard how the screen looks.
test.describe('Visual snapshots', { tag: '@visual' }, () => {
  test('GRID-001 Shop', async ({ page, shop }) => {
    await shop.goto();
    await expect(shop.productCount).toHaveText('12 products');
    await percySnapshot(page, 'Shop');
  });

  test('PDP-001 Product page', async ({ page, product }) => {
    await product.goto(productIds['Stoneware Mug Set (4)']);
    await expect(product.heading).toHaveText('Stoneware Mug Set (4)');
    await percySnapshot(page, 'Product page');
  });

  test('CART-001 Cart', async ({ page, seedCart, cart }) => {
    await seedCart({ 'Pour-Over Coffee Kit': 1, 'Steel Water Bottle': 2 });
    await cart.goto();
    await expect(cart.lines).toHaveCount(2);
    await percySnapshot(page, 'Cart');
  });

  test('MOB-002 Cart checkout bar on a phone', async ({ page, seedCart, cart }) => {
    await seedCart({ 'Pour-Over Coffee Kit': 1 });
    await cart.goto();
    await expect(cart.lines).toHaveCount(1);
    // Phone width only: there, the bar at the bottom of the cart replaces the summary's Checkout button.
    await percySnapshot(page, 'Cart checkout bar (phone)', { widths: [375] });
  });

  test('CHK-001 Checkout', async ({ page, seedCart, checkout }) => {
    await seedCart({ 'Steel Water Bottle': 1 });
    await checkout.goto();
    await expect(checkout.summary.total).toHaveText('₹548');
    await percySnapshot(page, 'Checkout');
  });

  test('ORD-001 Order confirmation', async ({ page, order, storeApi }) => {
    const orderId = await storeApi.placeOrder(meera, { 'The Pragmatic Checklist': 1, 'Steel Water Bottle': 1 });
    await order.goto(orderId);
    await expect(order.heading).toHaveText('Thank you, Meera!');
    await percySnapshot(page, 'Order confirmation');
  });
});
