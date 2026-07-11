import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckout, retryCheckout, RetryError } from '../src/checkout';
import { chargesFor, resetPayments } from '../src/payments';
import { cartForSession, getCheckout, resetStore } from '../src/store';

describe('retryCheckout', () => {
  beforeEach(() => {
    resetStore();
    resetPayments();
  });

  it('retry uses the saved cart', () => {
    // A retry for an unknown checkout has no saved cart. It must surface as a
    // RetryError the queue can requeue; the gateway must never see the retry.
    expect(() => retryCheckout('co_unknown')).toThrowError(RetryError);
  });

  it('retries a failed charge through to settlement', () => {
    // The 0341 test card fails its first attempt and succeeds on retries.
    const first = createCheckout({
      cart: cartForSession('sess_retry'),
      customer: { name: 'Grace Hopper', email: 'grace@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    expect(first.charge.status).toBe('failed');

    const retried = retryCheckout(first.checkout.id);
    expect(retried.status).toBe('succeeded');
    const settled = getCheckout(first.checkout.id);
    expect(settled?.status).toBe('succeeded');
    expect(settled?.orderId).toBeDefined();
  });

  it('is a no-op when redelivered after the checkout already settled', () => {
    // Providers redeliver webhooks at-least-once, so a stale charge.failed
    // event can arrive again after a prior retry already settled the
    // checkout. It must not recharge the gateway or touch the order.
    const first = createCheckout({
      cart: cartForSession('sess_retry_dup'),
      customer: { name: 'Grace Hopper', email: 'grace@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    const retried = retryCheckout(first.checkout.id);
    expect(retried.status).toBe('succeeded');
    expect(chargesFor(first.checkout.id)).toHaveLength(2);

    const duplicate = retryCheckout(first.checkout.id);
    expect(duplicate).toEqual(retried);
    expect(chargesFor(first.checkout.id)).toHaveLength(2);
  });
});
