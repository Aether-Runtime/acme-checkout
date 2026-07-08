import { formatCents } from '../api';
import type { CartPayload } from '../api';

export function CartView({
  cart,
  onQuantity,
  onCheckout,
}: {
  cart: CartPayload;
  onQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
}) {
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
