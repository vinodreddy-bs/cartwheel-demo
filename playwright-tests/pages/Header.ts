import type { Locator, Page } from '@playwright/test';

/** The site header: cart link, and the main nav (behind the Menu button below 768 px). */
export class Header {
  readonly cartLink: Locator;
  readonly menuButton: Locator;
  readonly shopLink: Locator;
  readonly adminLink: Locator;

  constructor(page: Page) {
    this.cartLink = page.getByRole('link', { name: /^Cart, \d+ items?$/ });
    this.menuButton = page.getByRole('button', { name: 'Menu', exact: true });
    const nav = page.getByRole('navigation', { name: 'Main', exact: true });
    this.shopLink = nav.getByRole('link', { name: 'Shop', exact: true });
    this.adminLink = nav.getByRole('link', { name: 'Admin', exact: true });
  }
}
