import { retryCheckout } from '../checkout';
import { findCharge } from '../payments';
import type { PaymentEvent } from '../types';

export interface RetryOutcome {
  handled: boolean;
  retried: boolean;
  chargeId?: string;
  reason: string;
}

/**
 * Handles charge.failed deliveries from the payment provider by retrying the
 * checkout from its saved cart.
 *
 * Providers redeliver webhooks whenever an ack is slow or lost, so this
 * handler must be idempotent: before retrying it looks up the current charge
 * for the checkout and returns early once one has already succeeded. Without
 * that guard a redelivered event would charge the shopper a second time.
 */
export function handleRetry(event: PaymentEvent): RetryOutcome {
  if (event.type !== 'charge.failed') {
    return { handled: false, retried: false, reason: `ignoring event type ${event.type}` };
  }
  const charge = findCharge(event);
  if (charge && charge.status === 'succeeded') {
    return {
      handled: true,
      retried: false,
      chargeId: charge.id,
      reason: 'charge already succeeded; duplicate delivery ignored',
    };
  }
  const result = retryCheckout(event.checkoutId);
  return {
    handled: true,
    retried: true,
    chargeId: result.id,
    reason: `retried checkout ${event.checkoutId}: ${result.status}`,
  };
}
