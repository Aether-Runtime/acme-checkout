# Retry worker crashes when a checkout has no saved cart

**Priority:** urgent
**Component:** checkout

## Observed

Since the retry refactor, the webhook retry path crashes on checkouts that
have no saved cart snapshot instead of requeueing them:

```
TypeError: charge: expected Cart, received null
    at charge (src/payments.ts)
    at retryCheckout (src/checkout.ts)
```

The unit test `retry uses the saved cart` fails the same way in CI.

## Expected

A retry with no saved cart must raise `RetryError` so the caller can requeue
the delivery. It must never reach the payment gateway.

## Reproduction

Call `retryCheckout` with a checkout id that has no snapshot (any id that
never went through `createCheckout`), or run `npm test`.
