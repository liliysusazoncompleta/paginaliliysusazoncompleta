import { NavLink } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

type HeaderProps = {
  cartCount: number;
};

export function Header({ cartCount }: HeaderProps) {
  return (
    <header className="header">
      <NavLink className="brand-inline" to="/">
        <img
          src="/logo-lili.png"
          alt="Lili y su Sazon Completa"
          onError={(event) => {
            event.currentTarget.src = '/logo-lili-placeholder.svg';
          }}
        />
        <strong>Lili y su Sazon Completa</strong>
      </NavLink>

      <nav className="main-nav" aria-label="Menu principal">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Sobre Nosotros
        </NavLink>
        <NavLink to="/catalogo" className={({ isActive }) => (isActive ? 'active' : '')}>
          Catalogo
        </NavLink>
        <NavLink to="/contacto" className={({ isActive }) => (isActive ? 'active' : '')}>
          Contacto
        </NavLink>
      </nav>

      <div className="header-actions">
        <NavLink to="/pedido" className="icon-btn cart-icon" aria-label="Ver carrito">
          <ShoppingCart size={18} />
          <strong>{cartCount}</strong>
        </NavLink>
      </div>
    </header>
  );
}
