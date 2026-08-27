import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatCents } from '../api';
import type { CartPayload } from '../api';

export function CartView({
  cart,
  onQuantity,
  onCheckout,
  onPromo,
}: {
  cart: CartPayload;
  onQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
  onPromo: (code: string) => Promise<string | null>;
}) {
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  async function handlePromoSubmit(event: FormEvent) {
    event.preventDefault();
    if (!promoCode.trim()) {
      return;
    }
    setPromoError(await onPromo(promoCode));
  }

  return (
    <section className="panel" data-testid="cart">
      <h1>Your cart</h1>
      <ul className="lines">
        {cart.cart.items.map((item) => (
          <li key={item.productId} className="line" data-testid="cart-line">
            <div>
              <div className="line-name">{item.name}</div>
              <div className="line-price">{formatCents(item.unitCents)}</div>
            </div>
            <div className="stepper">
              <button
                type="button"
                aria-label={`Remove one ${item.name}`}
                onClick={() => onQuantity(item.productId, item.quantity - 1)}
              >
                −
              </button>
              <span data-testid={`qty-${item.productId}`}>{item.quantity}</span>
              <button
                type="button"
                aria-label={`Add one ${item.name}`}
                onClick={() => onQuantity(item.productId, item.quantity + 1)}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      {cart.promo ? (
        <div className="promo-applied" data-testid="promo-applied">
          <span>
            {cart.promo.code} · {cart.promo.percentOff}% off
          </span>
          <span className="discount">−{formatCents(cart.discountCents)}</span>
        </div>
      ) : (
        <form className="promo-row" onSubmit={handlePromoSubmit}>
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Promo code"
            aria-label="Promo code"
            data-testid="promo-input"
          />
          <button type="submit" data-testid="promo-apply">
            Apply
          </button>
        </form>
      )}
      {promoError && (
        <div className="error" role="alert" data-testid="promo-error">
          {promoError}
        </div>
      )}
      {cart.promo && (
        <div className="subtotal-row">
          <span>Subtotal</span>
          <span data-testid="cart-subtotal">{formatCents(cart.subtotalCents)}</span>
        </div>
      )}
      <div className="total-row">
        <span>Total</span>
        <strong data-testid="cart-total">{formatCents(cart.totalCents)}</strong>
      </div>
      <button
        type="button"
        className="primary"
        data-testid="go-to-checkout"
        onClick={onCheckout}
        disabled={cart.cart.items.length === 0}
      >
        Check out
      </button>
    </section>
  );
}
