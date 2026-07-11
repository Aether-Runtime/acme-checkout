import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckout } from '../src/checkout';
import { chargesFor, eventForCharge, resetPayments } from '../src/payments';
import { cartForSession, resetStore } from '../src/store';
import { handleRetry, resetWebhookDedup } from '../src/webhooks/checkout';

describe('handleRetry', () => {
  beforeEach(() => {
    resetStore();
    resetPayments();
    resetWebhookDedup();
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

  it('does not recharge on a redelivered charge.failed event after settlement', () => {
    const first = createCheckout({
      cart: cartForSession('sess_hook_dup'),
      customer: { name: 'Grace Hopper', email: 'grace@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    const event = eventForCharge(first.charge);

    const delivery = handleRetry(event);
    expect(delivery.retried).toBe(true);
    expect(chargesFor(first.checkout.id)).toHaveLength(2);

    // The provider redelivers the same stale event; it must be a no-op.
    const redelivery = handleRetry(event);
    expect(redelivery.retried).toBe(true);
    expect(redelivery.chargeId).toBe(delivery.chargeId);
    expect(chargesFor(first.checkout.id)).toHaveLength(2);
  });

  it('does not place a second charge when a still-failed checkout gets a redelivered event', () => {
    // The 0002 test card always declines, so the retry itself fails too:
    // the checkout never reaches 'succeeded', so retryCheckout's status
    // guard alone can't catch a redelivery here. Dedup has to key on the
    // event id, not the checkout's outcome.
    const first = createCheckout({
      cart: cartForSession('sess_hook_dup_failed'),
      customer: { name: 'Grace Hopper', email: 'grace@example.com' },
      card: { number: '4000 0000 0000 0002', expMonth: 12, expYear: 2030, cvc: '000' },
    });
    expect(first.charge.status).toBe('failed');
    const event = eventForCharge(first.charge);

    const delivery = handleRetry(event);
    expect(delivery.retried).toBe(true);
    expect(chargesFor(first.checkout.id)).toHaveLength(2);

    // The provider redelivers the same event while the checkout is still
    // failed; it must not place another live charge attempt.
    const redelivery = handleRetry(event);
    expect(redelivery.retried).toBe(true);
    expect(redelivery.chargeId).toBe(delivery.chargeId);
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
