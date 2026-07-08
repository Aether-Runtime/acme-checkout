import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatCents, submitCheckout } from '../api';

export function CheckoutForm({
  total,
  onPaid,
}: {
  total: number;
  onPaid: (orderId: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await submitCheckout({ name, email, cardNumber });
    setBusy(false);
    if (result.status === 'succeeded' && result.orderId) {
      onPaid(result.orderId);
      return;
    }
    setError(result.failureReason ?? result.error ?? 'payment failed');
  }

  return (
    <section className="panel" data-testid="checkout">
      <h1>Checkout</h1>
      <p className="muted">
        Paying <strong>{formatCents(total)}</strong>
      </p>
      {error && (
        <div className="error" role="alert" data-testid="payment-error">
          Payment failed: {error.replaceAll('_', ' ')}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            data-testid="field-name"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
            data-testid="field-email"
            required
          />
        </label>
        <label>
          Card number
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
            data-testid="field-card"
            inputMode="numeric"
            required
          />
        </label>
        <button type="submit" className="primary" data-testid="pay" disabled={busy}>
          {busy ? 'Paying…' : 'Pay now'}
        </button>
      </form>
    </section>
  );
}
