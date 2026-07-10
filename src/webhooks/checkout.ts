import { retryCheckout } from '../checkout';
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
 */
export function handleRetry(event: PaymentEvent): RetryOutcome {
  if (event.type !== 'charge.failed') {
    return { handled: false, retried: false, reason: `ignoring event type ${event.type}` };
  }
  const result = retryCheckout(event.checkoutId);
  return {
    handled: true,
    retried: true,
    chargeId: result.id,
    reason: `retried checkout ${event.checkoutId}: ${result.status}`,
  };
}
