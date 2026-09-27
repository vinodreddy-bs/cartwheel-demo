import type { Locator, Page } from '@playwright/test';
import { OrderSummary } from './OrderSummary';

/** The order confirmation at `/order/:id`. */
export class OrderPage {
  readonly heading: Locator;
  readonly confirmation: Locator;
  readonly summary: OrderSummary;
  readonly deliveryDetails: Locator;
  readonly continueShopping: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('main').getByRole('heading', { level: 1 });
    this.confirmation = page.getByText(/^Order #\d+ is confirmed\./);
    this.summary = new OrderSummary(page.getByRole('region', { name: 'Your order' }));
    // The address block is a <section> with a heading but no accessible name, so it has no region role.
    this.deliveryDetails = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Delivering to' }) });
    this.continueShopping = page.getByRole('main').getByRole('link', { name: 'Continue shopping' });
  }

  async goto(orderId: number): Promise<void> {
    await this.page.goto(`/order/${orderId}`);
  }
}
