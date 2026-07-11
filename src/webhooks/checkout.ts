import { retryCheckout } from '../checkout';
import type { PaymentEvent } from '../types';

export interface RetryOutcome {
  handled: boolean;
  retried: boolean;
  chargeId?: string;
  reason: string;
}

/**
 * Providers redeliver webhooks at-least-once, and a redelivered event can
 * still find the checkout in a non-succeeded state (e.g. the retry itself
 * failed, or our 200 ack was lost). retryCheckout's status check alone can't
 * catch that case, since it has no notion of which event triggered it. Once
 * an event id has been run through retryCheckout, later deliveries of that
 * same id return the original outcome instead of attempting another charge.
 */
const processedEvents = new Map<string, RetryOutcome>();

export function resetWebhookDedup(): void {
  processedEvents.clear();
}

/**
 * Handles charge.failed deliveries from the payment provider by retrying the
 * checkout from its saved cart.
 */
export function handleRetry(event: PaymentEvent): RetryOutcome {
  if (event.type !== 'charge.failed') {
    return { handled: false, retried: false, reason: `ignoring event type ${event.type}` };
  }
  const processed = processedEvents.get(event.id);
  if (processed) {
    return {
      ...processed,
      reason: `event ${event.id} already processed; skipping duplicate delivery`,
    };
  }
  const result = retryCheckout(event.checkoutId);
  const outcome: RetryOutcome = {
    handled: true,
    retried: true,
    chargeId: result.id,
    reason: `retried checkout ${event.checkoutId}: ${result.status}`,
  };
  processedEvents.set(event.id, outcome);
  return outcome;
}
