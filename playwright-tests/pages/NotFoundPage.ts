import type { Locator, Page } from '@playwright/test';

/** The "Page not found" view shown for unknown products, orders and paths. */
export class NotFoundPage {
  readonly heading: Locator;
  readonly message: Locator;
  readonly backToShop: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Page not found' });
    this.message = page.getByText('We couldn’t find that page. It may have moved.');
    this.backToShop = page.getByRole('link', { name: 'Back to the shop' });
  }
}
