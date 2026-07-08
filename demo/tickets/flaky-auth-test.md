# Auth session test is timing-dependent

**Priority:** high
**Component:** auth

## Observed

The `sessions` unit test races a real 10 ms sleep against a 13 ms session
expiry window. Whether it passes depends on timer overshoot, so results vary
by machine and by load: it fails consistently on some CI runners and
developer machines and passes on others. Nothing about the auth code changes
between runs.

## Expected

The suite should be deterministic everywhere. `validateSession` accepts an
explicit `now` argument precisely so tests never need to sleep against the
wall clock; the boundary assertion should use it.

## Reproduction

Run `npm test` on a loaded machine, or repeatedly; the expiry-boundary
assertion in `tests/auth.test.ts` flips depending on how late the timer
fires.
