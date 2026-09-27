import { kabir } from '../data/customer';
import { expect, test } from '../fixtures/test';

// Seed catalogue sorted by price, cheapest first (server/store.js).
const BY_PRICE_LOW_TO_HIGH: [name: string, price: string][] = [
  ['Steel Water Bottle', '₹449'],
  ['The Pragmatic Checklist', '₹499'],
  ['Testing in the Age of AI', '₹599'],
  ['Stoneware Mug Set (4)', '₹649'],
  ['Designing Reliable Systems', '₹799'],
  ['Pulse Wireless Earbuds', '₹999'],
  ['Pour-Over Coffee Kit', '₹1,299'],
  ['Arc Desk Lamp', '₹1,849'],
  ['Trail Canvas Backpack', '₹1,999'],
  ['Boom Mini Speaker', '₹2,199'],
  ['Stride Smartwatch', '₹4,499'],
  ['Hush ANC Headphones', '₹7,999'],
];

const BY_NAME = [
  'Arc Desk Lamp',
  'Boom Mini Speaker',
  'Designing Reliable Systems',
  'Hush ANC Headphones',
  'Pour-Over Coffee Kit',
  'Pulse Wireless Earbuds',
  'Steel Water Bottle',
  'Stoneware Mug Set (4)',
  'Stride Smartwatch',
  'Testing in the Age of AI',
  'The Pragmatic Checklist',
  'Trail Canvas Backpack',
];

test.describe('Shop', { tag: '@shop' }, () => {
  test.beforeEach(async ({ shop }) => {
    await shop.goto();
  });

  test('GRID-001 Verify that user can narrow the shop to one category and see the whole catalogue again with All', { tag: '@P1' }, async ({ page, shop }) => {
    await expect(shop.productCount).toHaveText('12 products');

    await shop.category('Electronics').click();
    await expect(shop.productCount).toHaveText('4 products');
    await expect(shop.cardNames).toHaveText(['Pulse Wireless Earbuds', 'Stride Smartwatch', 'Boom Mini Speaker', 'Hush ANC Headphones']);
    await expect(shop.category('Electronics')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\?category=Electronics$/);

    await shop.category('All').click();
    await expect(shop.productCount).toHaveText('12 products');
    await expect(shop.category('All')).toHaveAttribute('aria-pressed', 'true');
    await expect(shop.category('Electronics')).toHaveAttribute('aria-pressed', 'false');
  });

  test('GRID-002 Verify that user can find products by searching for a word in their name or description', { tag: '@P1' }, async ({ shop }) => {
    // Neither product's name contains "battery"; both descriptions do.
    await shop.search.fill('battery');
    await expect(shop.productCount).toHaveText('2 products');
    await expect(shop.cardNames).toHaveText(['Pulse Wireless Earbuds', 'Stride Smartwatch']);

    await shop.search.fill('BOTTLE');
    await expect(shop.productCount).toHaveText('1 product');
    await expect(shop.cardNames).toHaveText(['Steel Water Bottle']);
  });

  test('GRID-003 Verify that user is told when no product matches the search and category, and can clear the filters to see every product again', { tag: '@P2' }, async ({ page, shop }) => {
    await shop.category('Books').click();
    // The search builds on the address the category chip sets, so let the chip apply first.
    await expect(shop.productCount).toHaveText('3 products');
    await shop.search.fill('lamp');
    await expect(shop.productCount).toHaveText('0 products');
    await expect(shop.emptyMessage).toHaveText('No products match “lamp” in Books.');
    await expect(shop.cards).toHaveCount(0);

    await shop.clearFilters.click();
    await expect(shop.productCount).toHaveText('12 products');
    await expect(shop.search).toHaveValue('');
    await expect(shop.category('All')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL((url) => url.search === '');
  });

  test('GRID-004 Verify that user can sort the shop by price in either direction and by name', { tag: '@P2' }, async ({ shop }) => {
    await shop.sort.selectOption({ label: 'Price: low to high' });
    await expect(shop.cardNames).toHaveText(BY_PRICE_LOW_TO_HIGH.map(([name]) => name));
    await expect(shop.cardPrices).toHaveText(BY_PRICE_LOW_TO_HIGH.map(([, price]) => price));

    const highToLow = [...BY_PRICE_LOW_TO_HIGH].reverse();
    await shop.sort.selectOption({ label: 'Price: high to low' });
    await expect(shop.cardNames).toHaveText(highToLow.map(([name]) => name));
    await expect(shop.cardPrices).toHaveText(highToLow.map(([, price]) => price));

    await shop.sort.selectOption({ label: 'Name' });
    await expect(shop.cardNames).toHaveText(BY_NAME);
  });

  test('GRID-005 Verify that the shop warns when a product is running low and stops it being added once it has sold out', { tag: '@P1' }, async ({ page, shop, product, header, storeApi }) => {
    await expect(shop.stockMessage('Arc Desk Lamp')).toHaveText('Only 3 left');
    await expect(shop.stockMessages).toHaveCount(1);
    await shop.addButton('Arc Desk Lamp').click();
    await expect(header.cartLink).toHaveAccessibleName('Cart, 1 item');

    await storeApi.placeOrder(kabir, { 'Arc Desk Lamp': 3 });
    await page.reload();
    await expect(shop.stockMessage('Arc Desk Lamp')).toHaveText('Out of stock');
    await expect(shop.addButton('Arc Desk Lamp')).toHaveText('Out of stock');
    await expect(shop.addButton('Arc Desk Lamp')).toBeDisabled();

    await shop.openProduct('Arc Desk Lamp');
    await expect(product.heading).toHaveText('Arc Desk Lamp');
    await expect(product.stock).toHaveText('Out of stock');
    await expect(product.quantity).toHaveCount(0);
    await expect(product.addToCart).toHaveCount(0);
  });
});
