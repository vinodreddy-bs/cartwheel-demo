import { expect, test } from '../fixtures/test';

test.describe('Phone layout', { tag: '@responsive' }, () => {
  test.skip(({ isMobile }) => !isMobile, 'Phone-sized layout only: from 768 px the nav is inline and the cart has no bottom bar');

  test('MOB-001 Verify that user on a phone-sized screen can open the menu and reach Admin from it', { tag: '@P2' }, async ({ page, shop, header, dashboard }) => {
    await shop.goto();
    await expect(header.menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(header.shopLink).toBeHidden();
    await expect(header.adminLink).toBeHidden();

    await header.menuButton.click();
    await expect(header.menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(header.shopLink).toBeVisible();
    await expect(header.adminLink).toBeVisible();

    await header.adminLink.click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(dashboard.heading).toBeVisible();
    await expect(header.menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(header.adminLink).toBeHidden();

    await header.menuButton.click();
    await expect(header.menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(header.adminLink).toBeVisible();
    await header.menuButton.click();
    await expect(header.menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(header.adminLink).toBeHidden();
  });

  test('MOB-002 Verify that user on a phone-sized screen can see the cart total and go to checkout from the bar at the bottom of the cart', { tag: '@P1' }, async ({ page, seedCart, cart, checkout }) => {
    await seedCart({ 'Pour-Over Coffee Kit': 1 });
    await cart.goto();

    await expect(cart.checkoutBar).toBeInViewport();
    await expect(cart.checkoutBar).toHaveCSS('position', 'fixed');
    await expect(cart.checkoutBar).toContainText('Total');
    await expect(cart.checkoutBarTotal).toHaveText('₹1,299');
    // The summary's own Checkout button is hidden at this size, so the bar's link is the only one.
    await expect(cart.checkoutLink).toHaveCount(1);
    await expect(cart.checkoutBar.getByRole('link', { name: 'Checkout', exact: true })).toBeVisible();

    await cart.increase('Pour-Over Coffee Kit').click();
    await expect(cart.checkoutBarTotal).toHaveText('₹2,598');
    await expect(cart.summary.total).toHaveText('₹2,598');

    await cart.checkoutBar.getByRole('link', { name: 'Checkout', exact: true }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(checkout.summary.total).toHaveText('₹2,598');
  });
});
