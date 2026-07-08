# Duplicate webhook delivery double-charges the shopper

**Priority:** urgent
**Component:** webhooks

## Observed

`handleRetry` re-charges the saved cart without checking whether the original
charge already succeeded. Payment providers redeliver webhooks whenever an
acknowledgement is slow or lost, so a `charge.failed` event delivered twice
charges the shopper a second time. The duplicate-delivery unit test fails,
and the second delivery also crashes on order creation afterward.

## Expected

Before retrying, the handler must look up the current charge for the checkout
and return early when `charge.status === 'succeeded'`. A redelivered event
should be acknowledged as a duplicate, not charged.

## Reproduction

Deliver the same `charge.failed` event to `POST /api/webhooks/payments`
twice, or run `npm test`.
