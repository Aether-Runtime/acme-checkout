export function Confirmation({ orderId }: { orderId: string }) {
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
      <p className="muted">A receipt is on its way to your inbox.</p>
    </section>
  );
}
