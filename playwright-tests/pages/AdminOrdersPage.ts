import type { Locator, Page } from '@playwright/test';

/** Admin › Orders at `/admin/orders`, newest first. */
export class AdminOrdersPage {
  readonly emptyMessage: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.emptyMessage = page.getByText('No orders yet.');
    this.rows = page.getByRole('table', { name: 'Orders' }).getByRole('row').filter({ has: page.getByRole('cell') });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/orders');
  }
}
