export interface Product {
  id: string;
  name: string;
  description: string;
  unitCents: number;
}

export interface CartItem {
  productId: string;
  name: string;
  unitCents: number;
  quantity: number;
}

export interface Customer {
  name: string;
  email: string;
}

export interface Card {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

/**
 * A cart is either a live shopping cart (items only) or, once a checkout has
 * started, a snapshot bound to a checkout with the customer and card attached.
 * Snapshots are what the payment gateway charges.
 */
export interface Cart {
  id: string;
  items: CartItem[];
  checkoutId?: string;
  customer?: Customer;
  card?: Card;
}

export type ChargeStatus = 'succeeded' | 'failed' | 'pending';

export interface Charge {
  id: string;
  checkoutId: string;
  amountCents: number;
  currency: 'usd';
  status: ChargeStatus;
  failureReason?: string;
  createdAt: number;
}

export interface PaymentEvent {
  id: string;
  type: 'charge.failed' | 'charge.succeeded';
  checkoutId: string;
  chargeId: string;
}

export type CheckoutStatus = 'pending' | 'succeeded' | 'failed';

export interface Checkout {
  id: string;
  cartId: string;
  status: CheckoutStatus;
  chargeId?: string;
  orderId?: string;
  createdAt: number;
}

export interface Order {
  id: string;
  checkoutId: string;
  customer: Customer;
  items: CartItem[];
  totalCents: number;
  createdAt: number;
}
