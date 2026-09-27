import type { Locator, Page } from '@playwright/test';

/** Admin › Products at `/admin/products`: the add form and the product table. */
export class AdminProductsPage {
  readonly name: Locator;
  readonly category: Locator;
  readonly price: Locator;
  readonly stock: Locator;
  readonly addProduct: Locator;
  readonly message: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel('Name', { exact: true });
    this.category = page.getByLabel('Category', { exact: true });
    this.price = page.getByLabel('Price (₹)', { exact: true });
    this.stock = page.getByLabel('Stock', { exact: true });
    this.addProduct = page.getByRole('button', { name: 'Add product' });
    this.message = page.getByRole('status');
    this.rows = page.getByRole('table', { name: 'Products' }).getByRole('row').filter({ has: page.getByRole('cell') });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/products');
  }

  /** The table row for one product. */
  row(name: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  }
}
