import percySnapshot from '@percy/playwright';
import { productIds } from '../data/catalogue';
import { meera } from '../data/customer';
import { expect, test } from '../fixtures/test';

// Visual snapshots for Percy. Run with `npm run test:visual`, which starts Percy around
// the run. Outside `percy exec`, percySnapshot logs that Percy is not running and does nothing.
test.describe('Visual snapshots', { tag: '@visual' }, () => {
  test('Shop', async ({ page, shop }) => {
    await shop.goto();
    await expect(shop.productCount).toHaveText('12 products');
    await percySnapshot(page, 'Shop');
  });

  test('Product page', async ({ page, product }) => {
    await product.goto(productIds['Stoneware Mug Set (4)']);
    await expect(product.heading).toHaveText('Stoneware Mug Set (4)');
    await percySnapshot(page, 'Product page');
  });

  test('Cart', async ({ page, seedCart, cart }) => {
    await seedCart({ 'Pour-Over Coffee Kit': 1, 'Steel Water Bottle': 2 });
    await cart.goto();
    await expect(cart.lines).toHaveCount(2);
    await percySnapshot(page, 'Cart');
  });

  test('Checkout', async ({ page, seedCart, checkout }) => {
    await seedCart({ 'Steel Water Bottle': 1 });
    await checkout.goto();
    await expect(checkout.summary.total).toHaveText('₹548');
    await percySnapshot(page, 'Checkout');
  });

  test('Order confirmation', async ({ page, order, storeApi }) => {
    const orderId = await storeApi.placeOrder(meera, { 'The Pragmatic Checklist': 1, 'Steel Water Bottle': 1 });
    await order.goto(orderId);
    await expect(order.heading).toHaveText('Thank you, Meera!');
    await percySnapshot(page, 'Order confirmation');
  });
});
