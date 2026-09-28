import type { Locator, Page } from '@playwright/test';

/** Admin › Orders at `/admin/orders`, newest first. */
export class AdminOrdersPage {
  readonly emptyMessage: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.emptyMessage = page.getByText('No orders yet.');
    this.table = page.getByRole('table', { name: 'Orders' });
    this.rows = this.table.getByRole('row').filter({ has: page.getByRole('cell') });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/orders');
  }

  /** The cell in `row` under the column whose header text is `header`. The column is looked up by that text on every call, so added or reordered columns don't break callers. */
  async cellByHeader(row: Locator, header: string): Promise<Locator> {
    const headers = await this.table.getByRole('columnheader').allInnerTexts();
    const index = headers.indexOf(header);
    if (index === -1) throw new Error(`No "${header}" column in the Orders table (have: ${headers.join(', ')})`);
    return row.getByRole('cell').nth(index);
  }
}
