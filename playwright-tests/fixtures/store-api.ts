import type { APIRequestContext } from '@playwright/test';
import { type Basket, toLines } from '../data/catalogue';
import type { Customer } from '../data/customer';

/** Test setup through the storefront API: seed resets, other shoppers' orders, a frozen clock. */
export class StoreApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Restores the seed catalogue, users and orders (the next order is #1001) and unfreezes the clock. */
  async reset(): Promise<void> {
    const res = await this.request.post('/api/test/reset');
    if (!res.ok()) {
      throw new Error(`POST /api/test/reset returned ${res.status()}. Is the app running with test hooks (npm run start:demo)?`);
    }
  }

  /** Places an order as another shopper would (a second browser), and returns its order number. */
  async placeOrder(customer: Customer, basket: Basket): Promise<number> {
    const res = await this.request.post('/api/orders', { data: { customer, items: toLines(basket) } });
    if (res.status() !== 201) throw new Error(`POST /api/orders returned ${res.status()}: ${await res.text()}`);
    const { order } = await res.json();
    return order.id;
  }

  /** How many orders the store holds. */
  async orderCount(): Promise<number> {
    const res = await this.request.get('/api/orders');
    if (!res.ok()) throw new Error(`GET /api/orders returned ${res.status()}`);
    return (await res.json()).total;
  }

  /** Freezes server time, so order timestamps are known. `reset()` unfreezes it. */
  async freezeClock(isoDateTime: string): Promise<void> {
    const res = await this.request.post('/api/test/clock', { data: { now: isoDateTime } });
    if (!res.ok()) throw new Error(`POST /api/test/clock returned ${res.status()}`);
  }
}
