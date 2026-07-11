import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { ChatAssistant } from './ChatAssistant';
import { WhatsAppFloating } from './WhatsAppFloating';
import { useCart } from '../lib/CartContext';

export function Layout() {
  const { cartCount, cart, lastCliente, error } = useCart();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Header cartCount={cartCount} />

      <main>
        <Outlet />
        {error ? <p className="error-text page-error">{error}</p> : null}
      </main>

      <footer className="site-footer">
        <p>Lili y su Sazon Completa - Sabor de Familia</p>
        <a href="https://www.instagram.com/liliysusazoncompleta" target="_blank" rel="noreferrer">
          @liliysusazoncompleta
        </a>
      </footer>

      <ChatAssistant />
      <WhatsAppFloating items={cart} cliente={lastCliente} />
    </div>
  );
}
