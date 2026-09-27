import { test as base, expect } from '@playwright/test';
import { type Basket, toLines } from '../data/catalogue';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { AdminProductsPage } from '../pages/AdminProductsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { Header } from '../pages/Header';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OrderPage } from '../pages/OrderPage';
import { ProductPage } from '../pages/ProductPage';
import { ShopPage } from '../pages/ShopPage';
import { StoreApi } from './store-api';

const CART_STORAGE_KEY = 'cartwheel.cart';

type Fixtures = {
  resetData: void;
  storeApi: StoreApi;
  /** Stores a cart in the browser, as if the shopper had filled it earlier. Open a page afterwards. */
  seedCart: (basket: Basket) => Promise<void>;
  header: Header;
  shop: ShopPage;
  product: ProductPage;
  notFound: NotFoundPage;
  cart: CartPage;
  checkout: CheckoutPage;
  order: OrderPage;
  dashboard: AdminDashboardPage;
  adminProducts: AdminProductsPage;
  adminOrders: AdminOrdersPage;
  adminUsers: AdminUsersPage;
};

export const test = base.extend<Fixtures>({
  storeApi: async ({ request }, use) => {
    await use(new StoreApi(request));
  },

  // Every test starts from seed data. Local storage (the cart) starts empty because
  // each test gets a fresh browser context.
  resetData: [
    async ({ storeApi }, use) => {
      await storeApi.reset();
      await use();
    },
    { auto: true },
  ],

  seedCart: async ({ page }, use) => {
    await use(async (basket) => {
      // /api/health is on the storefront's origin but doesn't start the app,
      // so nothing can overwrite the stored cart before the test opens a page.
      await page.goto('/api/health');
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [CART_STORAGE_KEY, JSON.stringify(toLines(basket))] as const,
      );
    });
  },

  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  shop: async ({ page }, use) => {
    await use(new ShopPage(page));
  },
  product: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  notFound: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  order: async ({ page }, use) => {
    await use(new OrderPage(page));
  },
  dashboard: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  adminProducts: async ({ page }, use) => {
    await use(new AdminProductsPage(page));
  },
  adminOrders: async ({ page }, use) => {
    await use(new AdminOrdersPage(page));
  },
  adminUsers: async ({ page }, use) => {
    await use(new AdminUsersPage(page));
  },
});

export { expect };
