import { useCallback, useEffect, useState } from 'react';
import { fetchCart, setQuantity } from './api';
import type { CartPayload } from './api';
import { CartView } from './components/CartView';
import { CheckoutForm } from './components/CheckoutForm';
import { Confirmation } from './components/Confirmation';

type View = 'cart' | 'checkout' | 'confirmation';

export function App() {
  const [view, setView] = useState<View>('cart');
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    void fetchCart().then(setCart);
  }, []);

  const handleQuantity = useCallback(async (productId: string, quantity: number) => {
    setCart(await setQuantity(productId, quantity));
  }, []);

  const handlePaid = useCallback((id: string) => {
    setOrderId(id);
    setView('confirmation');
  }, []);

  return (
    <div className="shell">
      <header className="masthead">
        <span className="brand">Acme Outfitters</span>
        <span className="crumb">
          {view === 'cart' ? 'Your cart' : view === 'checkout' ? 'Checkout' : 'Order confirmed'}
        </span>
      </header>
      <main>
        {view === 'cart' && cart && (
          <CartView
            cart={cart}
            onQuantity={handleQuantity}
            onCheckout={() => setView('checkout')}
          />
        )}
        {view === 'checkout' && cart && (
          <CheckoutForm total={cart.totalCents} onPaid={handlePaid} />
        )}
        {view === 'confirmation' && orderId && <Confirmation orderId={orderId} />}
      </main>
      <footer className="colophon">Acme Outfitters is a demo shop. Nothing is real.</footer>
    </div>
  );
}
