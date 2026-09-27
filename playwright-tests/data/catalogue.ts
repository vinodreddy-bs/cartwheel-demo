/** Seed product ids (server/store.js) for the products the tests put in carts and orders. */
export const productIds = {
  'Pulse Wireless Earbuds': 1,
  'Hush ANC Headphones': 4,
  'Pour-Over Coffee Kit': 5,
  'Stoneware Mug Set (4)': 6,
  'Arc Desk Lamp': 7,
  'Testing in the Age of AI': 8,
  'The Pragmatic Checklist': 10,
  'Steel Water Bottle': 12,
} as const;

export type ProductName = keyof typeof productIds;

/** Product name → quantity, e.g. `{ 'Steel Water Bottle': 2 }`. */
export type Basket = Partial<Record<ProductName, number>>;

/** Turns a basket into the `{ productId, quantity }` lines the cart and the orders API use. */
export function toLines(basket: Basket): { productId: number; quantity: number }[] {
  return Object.entries(basket).map(([name, quantity]) => ({
    productId: productIds[name as ProductName],
    quantity: quantity as number,
  }));
}
