import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckout, retryCheckout } from '../src/checkout';
import { chargesFor, eventForCharge, resetPayments } from '../src/payments';
import {
  applyPromo,
  cartForSession,
  chargeableTotal,
  clearCartForSession,
  findPromoCode,
  getCheckout,
  getOrder,
  promoDiscountCents,
  resetStore,
} from '../src/store';
import { handleRetry } from '../src/webhooks/checkout';

describe('promo codes', () => {
  beforeEach(() => {
    resetStore();
    resetPayments();
  });

  it('finds codes case-insensitively and ignores surrounding whitespace', () => {
    expect(findPromoCode(' trail10 ')?.percentOff).toBe(10);
    expect(findPromoCode('WELCOME15')?.percentOff).toBe(15);
    expect(findPromoCode('BOGUS')).toBeNull();
  });

  it('discounts the cart total by the promo percentage', () => {
    const cart = cartForSession('sess_promo');
    applyPromo(cart, findPromoCode('TRAIL10')!);
    expect(promoDiscountCents(cart)).toBe(1770);
    expect(chargeableTotal(cart)).toBe(15930);
  });

  it('carries no discount when the cart has no promo', () => {
    const cart = cartForSession('sess_plain');
    expect(promoDiscountCents(cart)).toBe(0);
    expect(chargeableTotal(cart)).toBe(17700);
  });

  it('records the order at the discounted total', () => {
    const cart = cartForSession('sess_order');
    applyPromo(cart, findPromoCode('TRAIL10')!);
    const result = createCheckout({
      cart,
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      card: { number: '4242 4242 4242 4242', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    expect(result.order).toBeDefined();
    expect(getOrder(result.order!.id)?.totalCents).toBe(15930);
  });

  it('charges exactly the total the shopper was shown', () => {
    const cart = cartForSession('sess_charge');
    applyPromo(cart, findPromoCode('TRAIL10')!);
    const shown = chargeableTotal(cart);
    const result = createCheckout({
      cart,
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      card: { number: '4242 4242 4242 4242', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    expect(result.charge.amountCents).toBe(shown);
    expect(result.charge.amountCents).toBe(15930);
  });

  it('charges the discounted total on webhook-driven retries too', () => {
    const cart = cartForSession('sess_retry');
    applyPromo(cart, findPromoCode('WELCOME15')!);
    const first = createCheckout({
      cart,
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    expect(first.charge.status).toBe('failed');
    const retried = retryCheckout(first.checkout.id);
    expect(retried.status).toBe('succeeded');
    expect(retried.amountCents).toBe(15045);
  });

  it('a redelivered retry of a promo checkout stays single-charged at the discounted total', () => {
    const cart = cartForSession('sess_redelivery');
    applyPromo(cart, findPromoCode('WELCOME15')!);
    const first = createCheckout({
      cart,
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      card: { number: '4000 0000 0000 0341', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    const event = eventForCharge(first.charge);

    const delivery = handleRetry(event);
    expect(delivery.retried).toBe(true);
    const redelivery = handleRetry(event);
    expect(redelivery.retried).toBe(false);

    const charges = chargesFor(first.checkout.id);
    expect(charges).toHaveLength(2);
    const settled = charges.at(-1)!;
    expect(settled.status).toBe('succeeded');
    expect(settled.amountCents).toBe(15045);
    const orderId = getCheckout(first.checkout.id)?.orderId;
    expect(orderId).toBeDefined();
    expect(getOrder(orderId!)?.totalCents).toBe(15045);
  });

  it('clears the promo when the cart is cleared after checkout', () => {
    const cart = cartForSession('sess_clear');
    applyPromo(cart, findPromoCode('TRAIL10')!);
    createCheckout({
      cart,
      customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
      card: { number: '4242 4242 4242 4242', expMonth: 12, expYear: 2030, cvc: '314' },
    });
    clearCartForSession('sess_clear');
    const next = cartForSession('sess_clear');
    expect(next.promo).toBeUndefined();
    expect(promoDiscountCents(next)).toBe(0);
  });
});
