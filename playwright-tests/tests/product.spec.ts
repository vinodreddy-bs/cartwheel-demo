import { productIds } from '../data/catalogue';
import { expect, test } from '../fixtures/test';

test.describe('Product page', { tag: '@product' }, () => {
  test('PDP-001 Verify that user can open a product from the shop, see its details and add a chosen quantity to the cart', { tag: '@P0' }, async ({ page, shop, product, header, cart }) => {
    await shop.goto();
    await shop.openProduct('Stoneware Mug Set (4)');
    await expect(product.heading).toHaveText('Stoneware Mug Set (4)');
    await expect(product.price).toHaveText('₹649');
    await expect(product.stock).toHaveText('In stock');
    await expect(product.main).toContainText('Four hand-glazed 350 ml mugs.');
    await expect(product.breadcrumb).toHaveText('Shop / Home & Kitchen');

    await product.increase.click();
    await expect(product.quantity).toHaveValue('2');
    await product.addToCart.click();
    await expect(product.message).toContainText('Added 2 × Stoneware Mug Set (4) to your cart.');
    await expect(product.viewCart).toBeVisible();
    await expect(product.quantity).toHaveValue('1');
    await expect(header.cartLink).toHaveAccessibleName('Cart, 2 items');

    await product.viewCart.click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(cart.lines).toHaveCount(1);
    await expect(cart.quantity('Stoneware Mug Set (4)')).toHaveValue('2');
    await expect(cart.lineTotal('Stoneware Mug Set (4)')).toHaveText('₹1,298');
    await expect(cart.summary.subtotal).toHaveText('₹1,298');
    await expect(cart.summary.shipping).toHaveText('Free');
    await expect(cart.summary.total).toHaveText('₹1,298');
  });

  test('PDP-002 Verify that user cannot choose a quantity below 1 or above the stock that is left on the product page', { tag: '@P1' }, async ({ product, header }) => {
    await product.goto(productIds['Arc Desk Lamp']);
    await expect(product.heading).toHaveText('Arc Desk Lamp');
    await expect(product.quantity).toHaveValue('1');
    await expect(product.decrease).toBeDisabled();

    await product.setQuantity('0');
    await expect(product.quantity).toHaveValue('1');

    await product.setQuantity('10');
    await expect(product.quantity).toHaveValue('3');
    await expect(product.increase).toBeDisabled();
    // Typed key by key: the field drops anything that isn't a digit as it is typed.
    await product.quantity.pressSequentially('ab');
    await expect(product.quantity).toHaveValue('3');

    await product.addToCart.click();
    await expect(product.message).toContainText('Added 3 × Arc Desk Lamp to your cart.');
    await expect(header.cartLink).toHaveAccessibleName('Cart, 3 items');
    await expect(product.allInCart).toBeDisabled();
  });

  test('PDP-003 Verify that user who follows a link to a product that does not exist sees Page not found and can get back to the shop', { tag: '@P2' }, async ({ page, notFound, shop }) => {
    for (const path of ['/product/999', '/product/abc']) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(notFound.heading).toBeVisible();
        await expect(notFound.message).toBeVisible();
      });
    }

    await notFound.backToShop.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(shop.productCount).toHaveText('12 products');
  });
});
