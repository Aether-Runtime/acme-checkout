import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { issueSession, validateSession } from './auth';
import { createCheckout } from './checkout';
import {
  cartForSession,
  cartTotal,
  clearCartForSession,
  getOrder,
  listProducts,
  setItemQuantity,
} from './store';
import { handleRetry } from './webhooks/checkout';
import type { PaymentEvent } from './types';

/**
 * Webhook deliveries are authenticated with a shared secret header. The demo
 * gateway is local, so the secret is a fixture, not a credential.
 */
export const PROVIDER_SIGNATURE = 'whsec_demo_0001';

function requireSession(req: Request, res: Response, next: NextFunction): void {
  const token = req.header('x-session-token');
  const session = token ? validateSession(token) : null;
  if (!token || !session) {
    res.status(401).json({ error: 'missing or invalid session token' });
    return;
  }
  res.locals.sessionToken = token;
  next();
}

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/products', (_req, res) => {
    res.json({ products: listProducts() });
  });

  app.post('/api/session', (_req, res) => {
    const session = issueSession();
    res.status(201).json({ token: session.token, expiresAt: session.expiresAt });
  });

  app.get('/api/cart', requireSession, (_req, res) => {
    const cart = cartForSession(res.locals.sessionToken as string);
    res.json({ cart, totalCents: cartTotal(cart) });
  });

  app.put('/api/cart/items', requireSession, (req, res) => {
    const { productId, quantity } = req.body as { productId?: string; quantity?: number };
    if (typeof productId !== 'string' || typeof quantity !== 'number') {
      res.status(400).json({ error: 'productId and quantity are required' });
      return;
    }
    const cart = cartForSession(res.locals.sessionToken as string);
    try {
      setItemQuantity(cart, productId, quantity);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
    res.json({ cart, totalCents: cartTotal(cart) });
  });

  app.post('/api/checkout', requireSession, (req, res) => {
    const token = res.locals.sessionToken as string;
    const { customer, card } = req.body as {
      customer?: { name?: string; email?: string };
      card?: { number?: string; expMonth?: number; expYear?: number; cvc?: string };
    };
    if (!customer?.name || !customer.email || !card?.number) {
      res.status(400).json({ error: 'customer and card are required' });
      return;
    }
    const cart = cartForSession(token);
    let result;
    try {
      result = createCheckout({
        cart,
        customer: { name: customer.name, email: customer.email },
        card: {
          number: card.number,
          expMonth: card.expMonth ?? 12,
          expYear: card.expYear ?? 2030,
          cvc: card.cvc ?? '000',
        },
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
    if (result.charge.status !== 'succeeded') {
      res.status(402).json({
        checkoutId: result.checkout.id,
        status: result.charge.status,
        failureReason: result.charge.failureReason ?? 'payment_failed',
      });
      return;
    }
    clearCartForSession(token);
    res.status(201).json({
      checkoutId: result.checkout.id,
      status: 'succeeded',
      orderId: result.order?.id,
    });
  });

  app.get('/api/orders/:id', requireSession, (req, res) => {
    const order = getOrder(String(req.params.id));
    if (!order) {
      res.status(404).json({ error: 'order not found' });
      return;
    }
    res.json({ order });
  });

  app.post('/api/webhooks/payments', (req, res) => {
    if (req.header('x-provider-signature') !== PROVIDER_SIGNATURE) {
      res.status(401).json({ error: 'invalid provider signature' });
      return;
    }
    const event = req.body as PaymentEvent;
    if (!event?.id || !event.type || !event.checkoutId) {
      res.status(400).json({ error: 'malformed event' });
      return;
    }
    try {
      const outcome = handleRetry(event);
      res.json(outcome);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/client');
  if (existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  return app;
}
