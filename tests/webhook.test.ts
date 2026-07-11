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

  it('redelivering the same charge.failed event after the retry already succeeded does not create a second charge', () => {
    const first = createCheckout({
      cart: cartForSession('sess_redeliver'),
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    expect(first.charge.status).toBe('failed');
    const event = eventForCharge(first.charge);

    const delivery = handleRetry(event);
    expect(delivery.retried).toBe(true);
    expect(delivery.reason).toContain('succeeded');
    expect(chargesFor(first.checkout.id)).toHaveLength(2);

    const redelivery = handleRetry(event);
    expect(redelivery.retried).toBe(true);
    expect(redelivery.reason).toContain('succeeded');
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
