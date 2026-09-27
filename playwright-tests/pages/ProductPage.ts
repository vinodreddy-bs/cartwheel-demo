import type { Locator, Page } from '@playwright/test';

/** A product page at `/product/:id`. */
export class ProductPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly price: Locator;
  readonly stock: Locator;
  readonly breadcrumb: Locator;
  readonly quantity: Locator;
  readonly decrease: Locator;
  readonly increase: Locator;
  readonly addToCart: Locator;
  readonly allInCart: Locator;
  readonly message: Locator;
  readonly viewCart: Locator;

  constructor(private readonly page: Page) {
    this.main = page.getByRole('main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.price = this.main.getByText(/^₹[\d,]+(\.\d{2})?$/);
    this.stock = this.main.getByText(/^(In stock|Only \d+ left|Out of stock)$/);
    this.breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    this.quantity = page.getByRole('textbox', { name: 'Quantity', exact: true });
    this.decrease = page.getByRole('button', { name: 'Decrease quantity', exact: true });
    this.increase = page.getByRole('button', { name: 'Increase quantity', exact: true });
    this.addToCart = this.main.getByRole('button', { name: 'Add to cart', exact: true });
    this.allInCart = this.main.getByRole('button', { name: 'All in your cart', exact: true });
    this.message = page.getByRole('status');
    this.viewCart = this.message.getByRole('link', { name: 'View cart' });
  }

  async goto(productId: number | string): Promise<void> {
    await this.page.goto(`/product/${productId}`);
  }

  /** Types a quantity and confirms it with Enter, as a shopper would. */
  async setQuantity(value: string): Promise<void> {
    await this.quantity.fill(value);
    await this.quantity.press('Enter');
  }
}
