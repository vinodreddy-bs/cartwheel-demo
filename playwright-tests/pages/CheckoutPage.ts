import type { Locator, Page } from '@playwright/test';
import type { Customer } from '../data/customer';
import { OrderSummary } from './OrderSummary';

/** The label of each delivery-detail field. */
export const FIELD_LABELS: Record<keyof Customer, string> = {
  name: 'Full name',
  email: 'Email',
  phone: 'Mobile number',
  address: 'Address',
  city: 'City',
  pin: 'PIN code',
};

/** Guest checkout at `/checkout`. */
export class CheckoutPage {
  readonly summary: OrderSummary;
  readonly cashOnDelivery: Locator;
  readonly placeOrder: Locator;
  readonly error: Locator;
  readonly backToCart: Locator;

  constructor(private readonly page: Page) {
    this.summary = new OrderSummary(page.getByRole('region', { name: 'Order summary' }));
    this.cashOnDelivery = page.getByRole('radio', { name: /Cash on delivery/ });
    this.placeOrder = page.getByTestId('place-order');
    this.error = page.getByRole('alert');
    this.backToCart = page.getByRole('link', { name: 'Back to cart' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  /** A delivery-detail input by the customer field it holds. */
  field(key: keyof Customer): Locator {
    return this.page.getByLabel(FIELD_LABELS[key], { exact: true });
  }

  /** Fills the given delivery details; fields not passed are left as they are. */
  async fillDetails(details: Partial<Customer>): Promise<void> {
    for (const [key, value] of Object.entries(details) as [keyof Customer, string][]) {
      await this.field(key).fill(value);
    }
  }
}
