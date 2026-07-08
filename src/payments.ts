import { randomUUID } from 'node:crypto';
import { cartTotal } from './store';
import type { Cart, Charge, ChargeStatus, PaymentEvent } from './types';

/**
 * Fake payment gateway. Stripe-shaped API, but everything is local,
 * in-memory, and deterministic. No network calls, ever.
 *
 * Test card behavior (last four digits of the card number):
 *   4242  always succeeds
 *   0002  always declined (card_declined)
 *   0341  declined on the first attempt for a checkout, succeeds on retries
 */

const charges: Charge[] = [];
const attemptsByCheckout = new Map<string, number>();
let eventCounter = 0;

function decideOutcome(
  cardNumber: string,
  attempt: number,
): { status: ChargeStatus; failureReason?: string } {
  const lastFour = cardNumber.replace(/\s+/g, '').slice(-4);
  if (lastFour === '0002') {
    return { status: 'failed', failureReason: 'card_declined' };
  }
  if (lastFour === '0341' && attempt === 1) {
    return { status: 'failed', failureReason: 'insufficient_funds' };
  }
  return { status: 'succeeded' };
}

/** Charges a checkout-bound cart snapshot and records the resulting charge. */
export function charge(cart: Cart): Charge {
  if (!cart) {
    throw new TypeError(`charge: expected Cart, received ${String(cart)}`);
  }
  if (!cart.checkoutId) {
    throw new TypeError('charge: cart is not bound to a checkout');
  }
  if (!cart.card) {
    throw new TypeError('charge: cart has no card on file');
  }
  const attempt = (attemptsByCheckout.get(cart.checkoutId) ?? 0) + 1;
  attemptsByCheckout.set(cart.checkoutId, attempt);
  const outcome = decideOutcome(cart.card.number, attempt);
  const record: Charge = {
    id: `ch_${randomUUID().slice(0, 12)}`,
    checkoutId: cart.checkoutId,
    amountCents: cartTotal(cart),
    currency: 'usd',
    status: outcome.status,
    failureReason: outcome.failureReason,
    createdAt: Date.now(),
  };
  charges.push(record);
  return record;
}

/**
 * Looks up the current charge referenced by a provider event. Events point at
 * a checkout, and like a real gateway lookup by payment intent this returns
 * the most recent charge for that checkout, not necessarily the one the event
 * was originally emitted for.
 */
export function findCharge(event: PaymentEvent): Charge | null {
  for (let i = charges.length - 1; i >= 0; i -= 1) {
    const candidate = charges[i];
    if (candidate.checkoutId === event.checkoutId) {
      return candidate;
    }
  }
  return null;
}

export function chargesFor(checkoutId: string): Charge[] {
  return charges.filter((record) => record.checkoutId === checkoutId);
}

/** Builds the webhook event a provider would deliver for a charge. */
export function eventForCharge(record: Charge): PaymentEvent {
  eventCounter += 1;
  return {
    id: `evt_${String(eventCounter).padStart(4, '0')}`,
    type: record.status === 'failed' ? 'charge.failed' : 'charge.succeeded',
    checkoutId: record.checkoutId,
    chargeId: record.id,
  };
}

export function resetPayments(): void {
  charges.length = 0;
  attemptsByCheckout.clear();
  eventCounter = 0;
}
