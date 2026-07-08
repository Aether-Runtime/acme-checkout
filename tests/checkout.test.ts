import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckout } from '../src/checkout';
import type { CheckoutInput } from '../src/checkout';
import { resetPayments } from '../src/payments';
import { cartForSession, getOrder, resetStore } from '../src/store';

function checkoutInput(cardNumber: string): CheckoutInput {
  return {
    cart: cartForSession('sess_test'),
    customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
    card: { number: cardNumber, expMonth: 12, expYear: 2030, cvc: '314' },
  };
}

describe('createCheckout', () => {
  beforeEach(() => {
    resetStore();
    resetPayments();
  });

  it('creates an order when the charge succeeds', () => {
    const result = createCheckout(checkoutInput('4242 4242 4242 4242'));
    expect(result.charge.status).toBe('succeeded');
    expect(result.checkout.status).toBe('succeeded');
    expect(result.order).toBeDefined();
    expect(getOrder(result.order!.id)?.totalCents).toBe(17700);
  });

  it('leaves the checkout failed when the card is declined', () => {
    const result = createCheckout(checkoutInput('4000 0000 0000 0002'));
    expect(result.charge.status).toBe('failed');
    expect(result.charge.failureReason).toBe('card_declined');
    expect(result.checkout.status).toBe('failed');
    expect(result.order).toBeUndefined();
  });

  it('rejects an empty cart before touching the gateway', () => {
    const input = checkoutInput('4242 4242 4242 4242');
    input.cart.items = [];
    expect(() => createCheckout(input)).toThrowError(/non-empty cart/);
  });
});
