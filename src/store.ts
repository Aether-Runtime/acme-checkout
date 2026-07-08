import { randomUUID } from 'node:crypto';
import type { Cart, CartItem, Checkout, Order, Product } from './types';

/**
 * In-memory storage. Every collection lives in module state and is reseeded
 * through resetStore(), which tests call between cases. Nothing here persists
 * across process restarts by design; this repo is a demo service.
 */

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_boots',
    name: 'Trailhead boots',
    description: 'Waterproof leather hiking boots with a recycled rubber sole',
    unitCents: 14900,
  },
  {
    id: 'prod_beanie',
    name: 'Merino beanie',
    description: 'Midweight merino wool beanie, one size',
    unitCents: 2800,
  },
  {
    id: 'prod_bottle',
    name: 'Insulated bottle',
    description: '750 ml vacuum-insulated steel bottle',
    unitCents: 4200,
  },
];

/** Product ids placed in every fresh cart. The bottle stays as a suggestion. */
const SEED_CART_PRODUCT_IDS = ['prod_boots', 'prod_beanie'];

const products = new Map<string, Product>();
const cartsBySession = new Map<string, Cart>();
const savedCarts = new Map<string, Cart>();
const checkouts = new Map<string, Checkout>();
const orders = new Map<string, Order>();

export function resetStore(): void {
  products.clear();
  cartsBySession.clear();
  savedCarts.clear();
  checkouts.clear();
  orders.clear();
  for (const product of SEED_PRODUCTS) {
    products.set(product.id, product);
  }
}

resetStore();

export function listProducts(): Product[] {
  return [...products.values()];
}

export function getProduct(id: string): Product | null {
  return products.get(id) ?? null;
}

function itemForProduct(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    name: product.name,
    unitCents: product.unitCents,
    quantity,
  };
}

/** Returns the session's cart, creating a seeded one on first access. */
export function cartForSession(sessionToken: string): Cart {
  const existing = cartsBySession.get(sessionToken);
  if (existing) {
    return existing;
  }
  const cart: Cart = {
    id: `cart_${randomUUID().slice(0, 8)}`,
    items: SEED_CART_PRODUCT_IDS.map((id) => {
      const product = products.get(id);
      if (!product) {
        throw new Error(`seed product missing from store: ${id}`);
      }
      return itemForProduct(product, 1);
    }),
  };
  cartsBySession.set(sessionToken, cart);
  return cart;
}

export function clearCartForSession(sessionToken: string): void {
  const cart = cartsBySession.get(sessionToken);
  if (cart) {
    cart.items = [];
  }
}

export function setItemQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`quantity must be a non-negative integer, got ${quantity}`);
  }
  const existing = cart.items.find((item) => item.productId === productId);
  if (quantity === 0) {
    cart.items = cart.items.filter((item) => item.productId !== productId);
    return cart;
  }
  if (existing) {
    existing.quantity = quantity;
    return cart;
  }
  const product = products.get(productId);
  if (!product) {
    throw new Error(`unknown product: ${productId}`);
  }
  cart.items.push(itemForProduct(product, quantity));
  return cart;
}

export function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0);
}

/**
 * Saved carts are the checkout-bound snapshots the retry path depends on.
 * They are stored by checkout id and kept after settlement so that late
 * webhook deliveries can still be resolved against them.
 */
export function saveCart(checkoutId: string, cart: Cart): void {
  savedCarts.set(checkoutId, structuredClone(cart));
}

export function loadSavedCart(checkoutId: string): Cart | null {
  return savedCarts.get(checkoutId) ?? null;
}

export function insertCheckout(checkout: Checkout): void {
  checkouts.set(checkout.id, checkout);
}

export function getCheckout(id: string): Checkout | null {
  return checkouts.get(id) ?? null;
}

export function updateCheckout(id: string, patch: Partial<Omit<Checkout, 'id'>>): Checkout {
  const checkout = checkouts.get(id);
  if (!checkout) {
    throw new Error(`unknown checkout: ${id}`);
  }
  Object.assign(checkout, patch);
  return checkout;
}

export function insertOrder(order: Order): void {
  orders.set(order.id, order);
}

export function getOrder(id: string): Order | null {
  return orders.get(id) ?? null;
}
