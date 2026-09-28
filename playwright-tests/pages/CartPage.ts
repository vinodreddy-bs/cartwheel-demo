import type { Locator, Page } from '@playwright/test';
import { OrderSummary } from './OrderSummary';

/** The cart at `/cart`. */
export class CartPage {
  readonly heading: Locator;
  readonly lines: Locator;
  readonly summary: OrderSummary;
  readonly checkoutLink: Locator;
  readonly checkoutBar: Locator;
  readonly checkoutBarTotal: Locator;
  readonly emptyHint: Locator;
  readonly continueShopping: Locator;
  readonly notice: Locator;
  readonly dismissNotice: Locator;
  readonly promoToggle: Locator;
  readonly promoInput: Locator;
  readonly promoApply: Locator;
  readonly promoMessage: Locator;
  readonly promoRemove: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('main').getByRole('heading', { level: 1 });
    this.lines = page.getByTestId('cart-line');
    this.summary = new OrderSummary(page.getByRole('region', { name: 'Order summary' }));
    // Only one Checkout link is displayed at a time: the summary's on desktop, the bottom bar's on phones.
    this.checkoutLink = page.getByRole('link', { name: 'Checkout', exact: true });
    // The phone checkout bar has no role or test id. It is the only block that holds the
    // displayed Checkout link without also holding the summary rows.
    this.checkoutBar = page.locator('div').filter({ has: this.checkoutLink }).filter({ hasNotText: 'Subtotal' });
    this.checkoutBarTotal = this.checkoutBar.getByText(/^₹/);
    this.emptyHint = page.getByText('Find something you’ll love.');
    this.continueShopping = page.getByRole('main').getByRole('link', { name: 'Continue shopping' });
    this.notice = page.getByRole('status');
    this.dismissNotice = page.getByRole('button', { name: 'Dismiss' });
    this.promoToggle = page.getByRole('button', { name: 'Have a promo code?' });
    this.promoInput = page.getByTestId('promo-input');
    this.promoApply = page.getByTestId('promo-apply');
    this.promoMessage = page.getByTestId('promo-message');
    this.promoRemove = page.getByTestId('promo-remove');
  }

  /** Opens the promo code form and applies the given code. */
  async applyPromo(code: string): Promise<void> {
    await this.promoToggle.click();
    await this.promoInput.fill(code);
    await this.promoApply.click();
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  /** The cart line for one product. */
  line(name: string): Locator {
    return this.lines.filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  /** The "₹N each" unit price on a line. */
  unitPrice(name: string): Locator {
    return this.line(name).getByText(/ each$/);
  }

  /** The line total on a line. */
  lineTotal(name: string): Locator {
    return this.line(name).getByText(/^₹[\d,]+(\.\d{2})?$/);
  }

  quantity(name: string): Locator {
    return this.page.getByRole('textbox', { name: `Quantity of ${name}`, exact: true });
  }

  increase(name: string): Locator {
    return this.page.getByRole('button', { name: `Increase quantity of ${name}`, exact: true });
  }

  decrease(name: string): Locator {
    return this.page.getByRole('button', { name: `Decrease quantity of ${name}`, exact: true });
  }

  async remove(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove ${name}`, exact: true }).click();
  }

  /** Types a quantity on a line and confirms it with Enter. */
  async setQuantity(name: string, value: string): Promise<void> {
    await this.quantity(name).fill(value);
    await this.quantity(name).press('Enter');
  }
}
