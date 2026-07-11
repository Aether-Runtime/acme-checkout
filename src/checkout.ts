import { randomUUID } from 'node:crypto';
import { charge, getCharge } from './payments';
import {
  cartTotal,
  getCheckout,
  insertCheckout,
  insertOrder,
  loadSavedCart,
  saveCart,
  updateCheckout,
} from './store';
import type { Card, Cart, Charge, Checkout, Customer, Order } from './types';

/** Raised when a retry cannot proceed; callers requeue instead of crashing. */
export class RetryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryError';
  }
}

export interface CheckoutInput {
  cart: Cart;
  customer: Customer;
  card: Card;
}

export interface CheckoutResult {
  checkout: Checkout;
  charge: Charge;
  order?: Order;
}

function validateInput(input: CheckoutInput): void {
  if (input.cart.items.length === 0) {
    throw new Error('checkout requires a non-empty cart');
  }
  if (!input.customer.name.trim() || !input.customer.email.includes('@')) {
    throw new Error('checkout requires a customer name and email');
  }
  const digits = input.card.number.replace(/\s+/g, '');
  if (!/^\d{12,19}$/.test(digits)) {
    throw new Error('checkout requires a 12-19 digit card number');
  }
}

function recordOrder(checkoutId: string, cart: Cart): Order {
  const existing = getCheckout(checkoutId);
  if (existing?.orderId) {
    throw new Error(`checkout ${checkoutId} already has order ${existing.orderId}`);
  }
  if (!cart.customer) {
    throw new Error(`saved cart for checkout ${checkoutId} has no customer`);
  }
  const order: Order = {
    id: `ord_${randomUUID().slice(0, 8)}`,
    checkoutId,
    customer: cart.customer,
    items: structuredClone(cart.items),
    totalCents: cartTotal(cart),
    createdAt: Date.now(),
  };
  insertOrder(order);
  return order;
}

/**
 * Runs a checkout: snapshots the cart against a new checkout id, then asks
 * the gateway to charge it. The snapshot is saved before the charge attempt
 * so a failed payment can be retried later from exactly what the shopper
 * agreed to pay.
 */
export function createCheckout(input: CheckoutInput): CheckoutResult {
  validateInput(input);
  const checkoutId = `co_${randomUUID().slice(0, 8)}`;
  const snapshot: Cart = {
    id: input.cart.id,
    checkoutId,
    items: structuredClone(input.cart.items),
    customer: input.customer,
    card: input.card,
  };
  saveCart(checkoutId, snapshot);
  insertCheckout({
    id: checkoutId,
    cartId: input.cart.id,
    status: 'pending',
    createdAt: Date.now(),
  });

  const result = charge(snapshot);
  if (result.status !== 'succeeded') {
    const checkout = updateCheckout(checkoutId, { status: 'failed', chargeId: result.id });
    return { checkout, charge: result };
  }
  const order = recordOrder(checkoutId, snapshot);
  const checkout = updateCheckout(checkoutId, {
    status: 'succeeded',
    chargeId: result.id,
    orderId: order.id,
  });
  return { checkout, charge: result, order };
}

/**
 * Retries a previously failed checkout from its saved cart snapshot. Retries
 * are driven by provider webhooks, so a missing snapshot must surface as a
 * RetryError the caller can requeue; it must never reach the gateway.
 */
export function retryCheckout(id: string): Charge {
  const cart = loadSavedCart(id);
  if (!cart) {
    throw new RetryError(`no saved cart for checkout ${id}`);
  }
  // A redelivered charge.failed event for a checkout that already settled
  // must not re-charge the customer; resolve it against the prior charge.
  const existingCheckout = getCheckout(id);
  if (existingCheckout?.status === 'succeeded' && existingCheckout.chargeId) {
    const settledCharge = getCharge(existingCheckout.chargeId);
    if (settledCharge) {
      return settledCharge;
    }
  }
  const result = charge(cart);
  if (result.status !== 'succeeded') {
    updateCheckout(id, { status: 'failed', chargeId: result.id });
    return result;
  }
  const order = recordOrder(id, cart);
  updateCheckout(id, { status: 'succeeded', chargeId: result.id, orderId: order.id });
  return result;
}
