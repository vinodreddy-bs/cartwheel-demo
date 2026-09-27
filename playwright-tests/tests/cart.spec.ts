import { expect, test } from '../fixtures/test';
import { CartPage } from '../pages/CartPage';
import { Header } from '../pages/Header';

test.describe('Cart', { tag: '@cart' }, () => {
  test('CART-001 Verify that the cart shows each product once with its quantity and line total, and adds them up to the right total', { tag: '@P0' }, async ({ shop, header, cart }) => {
    await shop.goto();
    await shop.addButton('Pour-Over Coffee Kit').click();
    await shop.addButton('Steel Water Bottle').click();
    await shop.addButton('Steel Water Bottle').click();
    await expect(header.cartLink).toHaveAccessibleName('Cart, 3 items');

    await header.cartLink.click();
    await expect(cart.heading).toHaveText('Your cart (3 items)');
    await expect(cart.lines).toHaveCount(2);
    await expect(cart.unitPrice('Pour-Over Coffee Kit')).toHaveText('₹1,299 each');
    await expect(cart.quantity('Pour-Over Coffee Kit')).toHaveValue('1');
    await expect(cart.lineTotal('Pour-Over Coffee Kit')).toHaveText('₹1,299');
    await expect(cart.unitPrice('Steel Water Bottle')).toHaveText('₹449 each');
    await expect(cart.quantity('Steel Water Bottle')).toHaveValue('2');
    await expect(cart.lineTotal('Steel Water Bottle')).toHaveText('₹898');
    await expect(cart.summary.subtotal).toHaveText('₹2,197');
    await expect(cart.summary.shipping).toHaveText('Free');
    await expect(cart.summary.total).toHaveText('₹2,197');
  });

  test('CART-002 Verify that user is charged ₹99 shipping when the cart subtotal is below ₹999, and no shipping at ₹999', { tag: '@P1' }, async ({ seedCart, shop, header, cart }) => {
    await seedCart({ 'The Pragmatic Checklist': 2 });
    await cart.goto();
    await expect(cart.summary.subtotal).toHaveText('₹998');
    await expect(cart.summary.shipping).toHaveText('₹99');
    await expect(cart.summary.total).toHaveText('₹1,097');
    await expect(cart.summary.freeDeliveryNote).toHaveText('Add ₹1 more for free delivery.');

    await cart.remove('The Pragmatic Checklist');
    await expect(cart.heading).toHaveText('Your cart is empty');
    await shop.goto();
    await shop.addButton('Pulse Wireless Earbuds').click();
    await header.cartLink.click();
    await expect(cart.summary.subtotal).toHaveText('₹999');
    await expect(cart.summary.shipping).toHaveText('Free');
    await expect(cart.summary.total).toHaveText('₹999');
    await expect(cart.summary.freeDeliveryNote).toHaveCount(0);
  });

  test('CART-003 Verify that shipping and the total are recalculated when user changes a quantity in the cart so the subtotal crosses ₹999', { tag: '@P1' }, async ({ seedCart, cart }) => {
    const item = 'The Pragmatic Checklist';
    await seedCart({ [item]: 2 });
    await cart.goto();
    await expect(cart.summary.shipping).toHaveText('₹99');

    await cart.increase(item).click();
    await expect(cart.quantity(item)).toHaveValue('3');
    await expect(cart.lineTotal(item)).toHaveText('₹1,497');
    await expect(cart.heading).toHaveText('Your cart (3 items)');
    await expect(cart.summary.subtotal).toHaveText('₹1,497');
    await expect(cart.summary.shipping).toHaveText('Free');
    await expect(cart.summary.total).toHaveText('₹1,497');

    await cart.setQuantity(item, '1');
    await expect(cart.lineTotal(item)).toHaveText('₹499');
    await expect(cart.heading).toHaveText('Your cart (1 item)');
    await expect(cart.summary.subtotal).toHaveText('₹499');
    await expect(cart.summary.shipping).toHaveText('₹99');
    await expect(cart.summary.total).toHaveText('₹598');
    await expect(cart.summary.freeDeliveryNote).toHaveText('Add ₹500 more for free delivery.');
    await expect(cart.decrease(item)).toBeDisabled();
  });

  test('CART-004 Verify that user can remove products from the cart, and once the last one is removed the cart is empty and checkout is not available', { tag: '@P1' }, async ({ page, seedCart, header, cart }) => {
    await seedCart({ 'Pulse Wireless Earbuds': 1, 'Steel Water Bottle': 1 });
    await cart.goto();
    await expect(cart.summary.subtotal).toHaveText('₹1,448');

    await cart.remove('Pulse Wireless Earbuds');
    await expect(cart.lines).toHaveCount(1);
    await expect(cart.line('Steel Water Bottle')).toBeVisible();
    await expect(cart.summary.subtotal).toHaveText('₹449');
    await expect(cart.summary.shipping).toHaveText('₹99');
    await expect(cart.summary.total).toHaveText('₹548');

    await cart.remove('Steel Water Bottle');
    await expect(cart.heading).toHaveText('Your cart is empty');
    await expect(cart.emptyHint).toBeVisible();
    await expect(cart.continueShopping).toBeVisible();
    await expect(header.cartLink).toHaveAccessibleName('Cart, 0 items');

    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/cart$/);
    await expect(cart.heading).toHaveText('Your cart is empty');
  });

  test('CART-005 Verify that user’s cart still holds its products and quantities after the page is reloaded', { tag: '@P0' }, async ({ page, context, seedCart, cart, header }) => {
    const expectSavedCart = async (cartPage: CartPage, headerBar: Header) => {
      await expect(cartPage.lines).toHaveCount(2);
      await expect(cartPage.quantity('Stoneware Mug Set (4)')).toHaveValue('2');
      await expect(cartPage.lineTotal('Stoneware Mug Set (4)')).toHaveText('₹1,298');
      await expect(cartPage.quantity('Testing in the Age of AI')).toHaveValue('1');
      await expect(cartPage.lineTotal('Testing in the Age of AI')).toHaveText('₹599');
      await expect(cartPage.summary.subtotal).toHaveText('₹1,897');
      await expect(cartPage.summary.shipping).toHaveText('Free');
      await expect(cartPage.summary.total).toHaveText('₹1,897');
      await expect(headerBar.cartLink).toHaveAccessibleName('Cart, 3 items');
    };

    await seedCart({ 'Stoneware Mug Set (4)': 2, 'Testing in the Age of AI': 1 });
    await cart.goto();
    await expect(cart.lines).toHaveCount(2);

    await page.reload();
    await test.step('after a reload', () => expectSavedCart(cart, header));

    // A second tab of the same browser: page objects are bound to a page, so build them for the new one.
    const tab = await context.newPage();
    const tabCart = new CartPage(tab);
    await tabCart.goto();
    await test.step('in a new tab', () => expectSavedCart(tabCart, new Header(tab)));
  });
});
