import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckout } from '../src/checkout';
import { chargesFor, eventForCharge, resetPayments } from '../src/payments';
import { cartForSession, resetStore } from '../src/store';
import { handleRetry } from '../src/webhooks/checkout';

describe('handleRetry', () => {
  beforeEach(() => {
    resetStore();
    resetPayments();
  });

  it('retries a failed charge from the saved cart', () => {
    const first = createCheckout({
      cart: cartForSession('sess_hook'),
      customer: { name: 'Grace Hopper', email: 'grace@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    expect(first.charge.status).toBe('failed');
    const event = eventForCharge(first.charge);

    const delivery = handleRetry(event);
    expect(delivery.retried).toBe(true);
    expect(delivery.reason).toContain('succeeded');
  });

  it('a duplicate delivery does not double-charge', () => {
    const first = createCheckout({
      cart: cartForSession('sess_hook_dup'),
      customer: { name: 'Grace Hopper', email: 'grace@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    const event = eventForCharge(first.charge);

    const delivery = handleRetry(event);
    expect(delivery.retried).toBe(true);

    // Providers redeliver events whenever an ack is slow or lost. The same
    // event arriving again must be recognized as settled, not charged again.
    const redelivery = handleRetry(event);
    expect(redelivery.retried).toBe(false);
    expect(redelivery.reason).toContain('duplicate');
    expect(chargesFor(first.checkout.id)).toHaveLength(2);
  });

  it('ignores charge.succeeded events', () => {
    const outcome = handleRetry({
      id: 'evt_9999',
      type: 'charge.succeeded',
      checkoutId: 'co_anything',
      chargeId: 'ch_anything',
    });
    expect(outcome.handled).toBe(false);
    expect(outcome.retried).toBe(false);
  });
});
