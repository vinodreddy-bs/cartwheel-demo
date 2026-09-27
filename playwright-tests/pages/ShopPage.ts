import type { Locator, Page } from '@playwright/test';

const STOCK_MESSAGE = /^(Only \d+ left|Out of stock)$/;

/** The shop grid at `/`: category chips, search, sort and product cards. */
export class ShopPage {
  readonly search: Locator;
  readonly sort: Locator;
  readonly productCount: Locator;
  readonly cards: Locator;
  readonly cardNames: Locator;
  readonly cardPrices: Locator;
  readonly stockMessages: Locator;
  readonly emptyMessage: Locator;
  readonly clearFilters: Locator;
  private readonly categories: Locator;

  constructor(private readonly page: Page) {
    this.categories = page.getByRole('group', { name: 'Category' });
    this.search = page.getByRole('searchbox', { name: 'Search products' });
    this.sort = page.getByLabel('Sort by');
    this.productCount = page.getByText(/^\d+ products?$/);
    this.cards = page.getByRole('article');
    this.cardNames = this.cards.getByRole('heading', { level: 3 });
    this.cardPrices = this.cards.getByText(/^₹[\d,]+(\.\d{2})?$/);
    // Paragraphs only: a sold-out card's button also reads "Out of stock".
    this.stockMessages = this.cards.getByRole('paragraph').filter({ hasText: STOCK_MESSAGE });
    this.emptyMessage = page.getByText(/^No products match/);
    this.clearFilters = page.getByRole('button', { name: 'Clear filters' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** A category chip, or "All". */
  category(name: string): Locator {
    return this.categories.getByRole('button', { name, exact: true });
  }

  /** The card for one product. */
  card(name: string): Locator {
    return this.cards.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  /** The "Only N left" / "Out of stock" message on one card. */
  stockMessage(name: string): Locator {
    return this.card(name).getByRole('paragraph').filter({ hasText: STOCK_MESSAGE });
  }

  /** The card's add button, named "Add <product> to cart". */
  addButton(name: string): Locator {
    return this.page.getByRole('button', { name: `Add ${name} to cart`, exact: true });
  }

  /** Opens a product page from its card title (the card image links there too). */
  async openProduct(name: string): Promise<void> {
    await this.card(name).getByRole('heading').getByRole('link').click();
  }
}
