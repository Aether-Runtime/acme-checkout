export interface CartItem {
  productId: string;
  name: string;
  unitCents: number;
  quantity: number;
}

export interface CartPayload {
  cart: { id: string; items: CartItem[] };
  totalCents: number;
}

export interface CheckoutPayload {
  checkoutId: string;
  status: string;
  orderId?: string;
  failureReason?: string;
  error?: string;
}

let sessionToken: string | null = null;

async function ensureSession(): Promise<string> {
  if (sessionToken) {
    return sessionToken;
  }
  const res = await fetch('/api/session', { method: 'POST' });
  const body = (await res.json()) as { token: string };
  sessionToken = body.token;
  return sessionToken;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await ensureSession();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-session-token': token,
      ...init.headers,
    },
  });
  return (await res.json()) as T;
}

export function fetchCart(): Promise<CartPayload> {
  return request<CartPayload>('/api/cart');
}

export function setQuantity(productId: string, quantity: number): Promise<CartPayload> {
  return request<CartPayload>('/api/cart/items', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity }),
  });
}

export function submitCheckout(input: {
  name: string;
  email: string;
  cardNumber: string;
}): Promise<CheckoutPayload> {
  return request<CheckoutPayload>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({
      customer: { name: input.name, email: input.email },
      card: { number: input.cardNumber, expMonth: 12, expYear: 2030, cvc: '314' },
    }),
  });
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
