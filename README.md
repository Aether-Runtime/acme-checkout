# acme-checkout

Checkout service and storefront for the Acme demo shop: an Express API and a
Vite + React storefront, all in TypeScript. Payments go through a fake local
gateway with a stripe-shaped API; nothing talks to the network and nothing in
here is a real credential.

## Run it

```sh
npm ci
npm run dev:api   # API on http://localhost:4000
npm run dev:web   # storefront on http://localhost:5173 (proxies /api)
```

Or build and serve both from one process:

```sh
npm run build && npm start
```

Test cards, keyed off the last four digits: `4242` always succeeds, `0002`
is always declined, `0341` fails its first attempt for a checkout and
succeeds on retries.

## Test it

```sh
npm test          # vitest unit suite
npm run e2e       # playwright checkout flows (records video)
npm run lint && npm run typecheck && npm run format
```

CI runs eight checks on every push and pull request: lint, typecheck,
format, unit, coverage, build, audit, and e2e-chromium.

## Demo bugs

Main is always green. Known regressions live as patches under `demo/bugs/`
with matching write-ups under `demo/tickets/`, and can be injected on demand:

```sh
scripts/inject-bug.sh retry-null-cart        # apply a regression
scripts/inject-bug.sh --revert retry-null-cart
```

Available bugs: `retry-null-cart` (retry crashes instead of requeueing),
`double-charge-webhook` (duplicate delivery re-charges the shopper), and
`flaky-auth-test` (an order-dependent test assertion).
