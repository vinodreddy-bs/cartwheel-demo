import type { Locator } from '@playwright/test';
import { kabir, meera } from '../data/customer';
import { expect, test } from '../fixtures/test';

// The Placed time is 4:00 pm IST on 28 Sep 2026. Browsers word it differently
// ("28 Sept 2026, 4:00 pm" in Chromium, "28 Sep 2026 at 4:00 PM" in WebKit).
const PLACED_AT = /^28[\s-]Sept?[\s-]2026\b.*\b4:00\s?pm$/i;

test.describe('Admin', { tag: '@admin' }, () => {
  test('ADM-001 Verify that the admin dashboard figures reflect the orders shoppers have placed', { tag: '@P2' }, async ({ page, dashboard, storeApi }) => {
    const expectFigures = async (figures: Record<string, string>) => {
      for (const [label, value] of Object.entries(figures)) {
        await expect(dashboard.statValue(label), label).toHaveText(value);
      }
    };

    await dashboard.goto();
    await test.step('before any order', () => expectFigures({
      Revenue: '₹0',
      Orders: '0',
      'Average order': '₹0',
      Products: '12',
      'Low stock (< 10)': '1',
      Users: '3',
    }));

    await storeApi.placeOrder(meera, { 'Steel Water Bottle': 1 });
    await storeApi.placeOrder(kabir, { 'Hush ANC Headphones': 3 });
    await page.reload();
    // ₹548 + ₹23,997; Hush ANC Headphones is down to 9, joining Arc Desk Lamp in low stock.
    await test.step('after two orders', () => expectFigures({
      Revenue: '₹24,545',
      Orders: '2',
      'Average order': '₹12,272.50',
      Products: '12',
      'Low stock (< 10)': '2',
      Users: '3',
    }));
  });

  test('ADM-002 Verify that admin can add a product with a price in rupees and paise, and shoppers see it in the shop at that price', { tag: '@P1' }, async ({ adminProducts, shop, header }) => {
    await adminProducts.goto();
    await expect(adminProducts.rows).toHaveCount(12);

    await adminProducts.name.fill('Linen Table Runner');
    await adminProducts.category.selectOption('Home & Kitchen');
    await adminProducts.price.fill('abc');
    await adminProducts.addProduct.click();
    await expect(adminProducts.message).toHaveText('Enter a price in rupees, e.g. 1299 or 1299.50.');
    await expect(adminProducts.rows).toHaveCount(12);

    await adminProducts.price.fill('1299.50');
    await adminProducts.stock.fill('4');
    await adminProducts.addProduct.click();
    await expect(adminProducts.message).toHaveText('Added Linen Table Runner.');
    await expect(adminProducts.name).toHaveValue('');
    await expect(adminProducts.category).toHaveValue('');
    await expect(adminProducts.price).toHaveValue('');
    await expect(adminProducts.stock).toHaveValue('');
    await expect(adminProducts.rows).toHaveCount(13);
    await expect(adminProducts.row('Linen Table Runner').getByRole('cell')).toHaveText(['Linen Table Runner', 'Home & Kitchen', '₹1,299.50', '4']);

    await shop.goto();
    await expect(shop.productCount).toHaveText('13 products');
    await expect(shop.card('Linen Table Runner')).toContainText('₹1,299.50');
    await expect(shop.stockMessage('Linen Table Runner')).toHaveText('Only 4 left');
    await shop.addButton('Linen Table Runner').click();
    await expect(header.cartLink).toHaveAccessibleName('Cart, 1 item');

    await shop.category('Home & Kitchen').click();
    await expect(shop.productCount).toHaveText('4 products');
    await expect(shop.card('Linen Table Runner')).toBeVisible();
  });

  test('ADM-003 Verify that orders placed by shoppers appear in the admin Orders list, newest first, with the customer, item count and total', { tag: '@P1' }, async ({ page, adminOrders, storeApi }) => {
    await storeApi.freezeClock('2026-09-28T10:30:00Z');
    await adminOrders.goto();
    await expect(adminOrders.emptyMessage).toBeVisible();

    expect(await storeApi.placeOrder(meera, { 'Steel Water Bottle': 1 })).toBe(1001);
    expect(await storeApi.placeOrder(kabir, { 'The Pragmatic Checklist': 2, 'Testing in the Age of AI': 1 })).toBe(1002);
    await page.reload();

    await expect(adminOrders.rows).toHaveCount(2);
    // Newest first, so the row order is the behaviour under test. Cells are read by column
    // header rather than position, so extra columns don't affect this check. innerText shows
    // the status as displayed.
    const expectRow = async (row: Locator, values: Record<string, string | RegExp>) => {
      for (const [header, value] of Object.entries(values)) {
        await expect(await adminOrders.cellByHeader(row, header), header).toHaveText(value, { useInnerText: true });
      }
    };
    await expectRow(adminOrders.rows.nth(0), { Order: '#1002', Customer: 'Kabir Mehta', Items: '3', Total: '₹1,597', Status: 'Placed', Placed: PLACED_AT });
    await expectRow(adminOrders.rows.nth(1), { Order: '#1001', Customer: 'Meera Iyer', Items: '1', Total: '₹548', Status: 'Placed', Placed: PLACED_AT });
  });

  test('ADM-004 Verify that admin can add a user, and cannot add another user with an email that is already registered', { tag: '@P2' }, async ({ adminUsers }) => {
    await adminUsers.goto();
    await expect(adminUsers.rows).toHaveCount(3);

    await adminUsers.name.fill('Rohan Das');
    await adminUsers.email.fill('rohan@example.com');
    await adminUsers.role.selectOption({ label: 'Admin' });
    await adminUsers.addUser.click();
    await expect(adminUsers.message).toHaveText('Added Rohan Das.');
    await expect(adminUsers.name).toHaveValue('');
    await expect(adminUsers.email).toHaveValue('');
    await expect(adminUsers.role).toHaveValue('user');
    await expect(adminUsers.rows).toHaveCount(4);
    await expect(adminUsers.row('Rohan Das').getByRole('cell')).toHaveText(
      ['Rohan Das', 'rohan@example.com', 'Admin', 'Delete'],
      { useInnerText: true },
    );

    await adminUsers.name.fill('Asha Again');
    await adminUsers.email.fill('ASHA@example.com');
    await adminUsers.addUser.click();
    await expect(adminUsers.message).toHaveText('Email already exists');
    await expect(adminUsers.rows).toHaveCount(4);
  });

  test('ADM-005 Verify that admin can delete a user after confirming, and nothing is deleted when they cancel', { tag: '@P2' }, async ({ page, adminUsers }) => {
    await adminUsers.goto();
    await expect(adminUsers.rows).toHaveText([/^Asha Rao/, /^Kabir Mehta/, /^Priya Nair/]);

    expect(await adminUsers.deleteUser('Kabir Mehta', { confirm: false })).toBe('Delete Kabir Mehta?');
    await expect(adminUsers.rows).toHaveText([/^Asha Rao/, /^Kabir Mehta/, /^Priya Nair/]);

    expect(await adminUsers.deleteUser('Kabir Mehta', { confirm: true })).toBe('Delete Kabir Mehta?');
    await expect(adminUsers.message).toHaveText('Deleted Kabir Mehta.');
    await expect(adminUsers.rows).toHaveText([/^Asha Rao/, /^Priya Nair/]);

    await page.reload();
    await expect(adminUsers.rows).toHaveText([/^Asha Rao/, /^Priya Nair/]);
  });
});
