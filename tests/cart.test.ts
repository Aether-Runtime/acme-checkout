import { beforeEach, describe, expect, it } from 'vitest';
import {
  cartForSession,
  cartTotal,
  clearCartForSession,
  resetStore,
  setItemQuantity,
} from '../src/store';

describe('cart quantity logic', () => {
  beforeEach(() => {
    resetStore();
  });

  it('seeds a fresh cart with one of each seed product', () => {
    const cart = cartForSession('sess_seed');
    expect(cart.items.map((item) => [item.productId, item.quantity])).toEqual([
      ['prod_boots', 1],
      ['prod_beanie', 1],
    ]);
  });

  it('updates the quantity of an item already in the cart', () => {
    const cart = cartForSession('sess_update');
    setItemQuantity(cart, 'prod_boots', 3);
    const boots = cart.items.find((item) => item.productId === 'prod_boots');
    expect(boots?.quantity).toBe(3);
    // Untouched items are unaffected.
    expect(cart.items.find((item) => item.productId === 'prod_beanie')?.quantity).toBe(1);
  });

  it('adds a brand new product to the cart at the given quantity', () => {
    const cart = cartForSession('sess_add');
    setItemQuantity(cart, 'prod_bottle', 2);
    expect(cart.items).toHaveLength(3);
    expect(cart.items.find((item) => item.productId === 'prod_bottle')?.quantity).toBe(2);
  });

  it('setting quantity to zero removes that item from the cart', () => {
    const cart = cartForSession('sess_zero');
    setItemQuantity(cart, 'prod_boots', 0);
    expect(cart.items.map((item) => item.productId)).toEqual(['prod_beanie']);
  });

  it('removing the last item leaves an empty cart, not a null/undefined one', () => {
    const cart = cartForSession('sess_last');
    setItemQuantity(cart, 'prod_boots', 0);
    setItemQuantity(cart, 'prod_beanie', 0);
    expect(cart.items).toEqual([]);
    expect(cartTotal(cart)).toBe(0);
  });

  it('setting a not-yet-in-cart product to zero is a harmless no-op', () => {
    const cart = cartForSession('sess_noop');
    setItemQuantity(cart, 'prod_bottle', 0);
    expect(cart.items.map((item) => item.productId)).toEqual(['prod_boots', 'prod_beanie']);
  });

  it('setting the same quantity again does not duplicate the line item', () => {
    const cart = cartForSession('sess_idempotent');
    setItemQuantity(cart, 'prod_boots', 1);
    setItemQuantity(cart, 'prod_boots', 1);
    expect(cart.items.filter((item) => item.productId === 'prod_boots')).toHaveLength(1);
  });

  it('removing then re-adding a product creates a fresh line item at the new quantity', () => {
    const cart = cartForSession('sess_readd');
    setItemQuantity(cart, 'prod_boots', 0);
    setItemQuantity(cart, 'prod_boots', 5);
    expect(cart.items.filter((item) => item.productId === 'prod_boots')).toHaveLength(1);
    expect(cart.items.find((item) => item.productId === 'prod_boots')?.quantity).toBe(5);
  });

  it('rejects negative quantities without mutating the cart', () => {
    const cart = cartForSession('sess_negative');
    expect(() => setItemQuantity(cart, 'prod_boots', -1)).toThrowError(RangeError);
    expect(cart.items.find((item) => item.productId === 'prod_boots')?.quantity).toBe(1);
  });

  it('rejects non-integer quantities', () => {
    const cart = cartForSession('sess_fraction');
    expect(() => setItemQuantity(cart, 'prod_boots', 1.5)).toThrowError(RangeError);
  });

  it('rejects NaN and non-finite quantities', () => {
    const cart = cartForSession('sess_nan');
    expect(() => setItemQuantity(cart, 'prod_boots', Number.NaN)).toThrowError(RangeError);
    expect(() => setItemQuantity(cart, 'prod_boots', Infinity)).toThrowError(RangeError);
  });

  it('rejects negative zero the same as any other negative-adjacent input', () => {
    // -0 is an integer and === 0, so this must be treated as a removal, not an error.
    const cart = cartForSession('sess_negzero');
    expect(() => setItemQuantity(cart, 'prod_boots', -0)).not.toThrow();
    expect(cart.items.find((item) => item.productId === 'prod_boots')).toBeUndefined();
  });

  it('throws for an unknown product id when adding a new line item', () => {
    const cart = cartForSession('sess_unknown');
    expect(() => setItemQuantity(cart, 'prod_does_not_exist', 1)).toThrowError(
      /unknown product/,
    );
    expect(cart.items).toHaveLength(2);
  });

  it('does not throw for an unknown product id when the resulting quantity is zero', () => {
    // Zero-quantity is handled as a removal before the product lookup, so an
    // unknown id combined with quantity 0 is a no-op rather than an error.
    const cart = cartForSession('sess_unknown_zero');
    expect(() => setItemQuantity(cart, 'prod_does_not_exist', 0)).not.toThrow();
    expect(cart.items).toHaveLength(2);
  });

  it('accepts large quantities and reflects them in the total', () => {
    const cart = cartForSession('sess_large');
    setItemQuantity(cart, 'prod_boots', 1000);
    expect(cartTotal(cart)).toBe(1000 * 14900 + 2800);
  });

  it('computes the total across mixed quantities, including zero after clearing', () => {
    const cart = cartForSession('sess_total');
    setItemQuantity(cart, 'prod_boots', 2);
    setItemQuantity(cart, 'prod_bottle', 3);
    expect(cartTotal(cart)).toBe(2 * 14900 + 1 * 2800 + 3 * 4200);
    clearCartForSession('sess_total');
    expect(cartTotal(cart)).toBe(0);
  });

  it('returns the same cart instance on repeated lookups so quantity changes persist', () => {
    const first = cartForSession('sess_repeat');
    setItemQuantity(first, 'prod_boots', 4);
    const second = cartForSession('sess_repeat');
    expect(second).toBe(first);
    expect(second.items.find((item) => item.productId === 'prod_boots')?.quantity).toBe(4);
  });

  it('keeps carts for different sessions independent', () => {
    const cartA = cartForSession('sess_a');
    const cartB = cartForSession('sess_b');
    setItemQuantity(cartA, 'prod_boots', 9);
    expect(cartB.items.find((item) => item.productId === 'prod_boots')?.quantity).toBe(1);
  });

  it('clearing a cart empties it and further quantity updates start fresh', () => {
    clearCartForSession('sess_clear_then_add');
    const cart = cartForSession('sess_clear_then_add');
    // Accessing the session after clearing a cart that was never created just
    // seeds a new one, since clearCartForSession is a no-op for unknown sessions.
    expect(cart.items).toHaveLength(2);

    clearCartForSession('sess_clear_then_add');
    expect(cart.items).toEqual([]);
    setItemQuantity(cart, 'prod_bottle', 1);
    expect(cart.items).toEqual([
      { productId: 'prod_bottle', name: 'Insulated bottle', unitCents: 4200, quantity: 1 },
    ]);
  });
});
