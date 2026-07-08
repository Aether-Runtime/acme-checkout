---
name: webhook-testing
description: How this repo writes and verifies webhook idempotency tests
---

Payment providers redeliver webhooks whenever an acknowledgement is slow or
lost, so every webhook handler in this repo must be safe to run twice with
the same event. When you touch a handler or write tests for one:

1. Always test duplicate delivery explicitly: call the handler twice with the
   exact same event object and assert the second call is acknowledged without
   side effects (`retried: false`, charge count unchanged).
2. Use the fake gateway's test cards to set up state: `...0341` fails the
   first attempt for a checkout and succeeds on retries, which is the
   canonical way to produce a real `charge.failed` event via
   `eventForCharge`.
3. Assert on side effects, not just return values: `chargesFor(checkoutId)`
   gives the full charge history, which is what proves nobody got charged
   twice.
4. Reset module state in `beforeEach` with `resetStore()` and
   `resetPayments()`; the store is module-global by design.
5. Idempotency guards belong at the top of the handler, before any call that
   can create a charge, and should key off the gateway's view of the world
   (`findCharge`), not local bookkeeping.
