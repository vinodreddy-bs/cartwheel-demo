import type { Locator } from '@playwright/test';

/** The order summary block shared by the cart, checkout and confirmation pages. */
export class OrderSummary {
  readonly items: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly freeDeliveryNote: Locator;

  constructor(root: Locator) {
    this.items = root.getByRole('listitem');
    this.subtotal = root.getByTestId('summary-subtotal');
    this.discount = root.getByTestId('summary-discount');
    this.shipping = root.getByTestId('summary-shipping');
    this.total = root.getByTestId('summary-total');
    this.freeDeliveryNote = root.getByText(/^Add ₹[\d,.]+ more for free delivery\.$/);
  }

  /** The summary row for one product: "<name> × <qty>" followed by its line total. */
  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }
}
