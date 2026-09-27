import type { Locator, Page } from '@playwright/test';

/** The admin dashboard at `/admin`. */
export class AdminDashboardPage {
  readonly heading: Locator;
  private readonly overview: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Admin', level: 1 });
    this.overview = page.getByRole('region', { name: 'Store overview' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }

  /** The figure on one stat card, found by the card's label (e.g. "Revenue"). */
  statValue(label: string): Locator {
    // Stat cards have no role or test id: a card is the block inside the overview that holds the label.
    const card = this.overview.locator('div').filter({ has: this.page.getByText(label, { exact: true }) });
    return card.getByRole('paragraph').filter({ hasNotText: label });
  }
}
