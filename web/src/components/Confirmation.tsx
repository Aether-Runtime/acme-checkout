import { formatCents } from '../api';

export function Confirmation({
  orderId,
  amountChargedCents,
}: {
  orderId: string;
  amountChargedCents: number | null;
}) {
  return (
    <section className="panel confirm" data-testid="confirmation">
      <div className="check" aria-hidden>
        ✓
      </div>
      <h1>Order confirmed</h1>
      <p className="muted">
        Thanks for shopping with Acme. Your order id is{' '}
        <strong data-testid="order-id">{orderId}</strong>.
      </p>
      {amountChargedCents !== null && (
        <p className="muted">
          We charged <strong data-testid="charged-amount">{formatCents(amountChargedCents)}</strong>{' '}
          to your card.
        </p>
      )}
      <p className="muted">A receipt is on its way to your inbox.</p>
    </section>
  );
}
