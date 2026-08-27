import { beforeEach, describe, expect, it } from 'vitest';
import { createCheckout } from '../src/checkout';
import { resetPayments } from '../src/payments';
import {
  applyPromo,
  cartForSession,
  chargeableTotal,
  findPromoCode,
  getOrder,
  promoDiscountCents,
  resetStore,
} from '../src/store';

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
});
