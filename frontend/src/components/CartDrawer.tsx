import { Minus, Plus, Trash2, X } from 'lucide-react';
import type { CartItem } from '../types';
import { formatCOP } from '../lib/utils';

type CartDrawerProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onIncrease: (idProducto: number) => void;
  onDecrease: (idProducto: number) => void;
  onRemove: (idProducto: number) => void;
  onCheckout: () => void;
};

export function CartDrawer({
  open,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = items.reduce((acc, item) => acc + item.valor * item.cantidad, 0);
  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <>
      {open && <button className="overlay" aria-label="Cerrar carrito" onClick={onClose} />}
      <aside className={open ? 'cart-drawer open' : 'cart-drawer'}>
        <header>
          <h2>Tu carrito</h2>
          <button aria-label="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="cart-items">
          {items.length === 0 ? (
            <p className="empty-cart">Aun no agregas productos.</p>
          ) : (
            items.map((item) => (
              <article key={item.id_producto} className="cart-item">
                <div>
                  <h4>{item.nombre}</h4>
                  <small>{item.presentacion}</small>
                  <p>{formatCOP(item.valor)}</p>
                </div>

                <div className="qty-control">
                  <button onClick={() => onDecrease(item.id_producto)} aria-label="Restar">
                    <Minus size={14} />
                  </button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => onIncrease(item.id_producto)} aria-label="Sumar">
                    <Plus size={14} />
                  </button>
                  <button
                    className="danger"
                    onClick={() => onRemove(item.id_producto)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <footer>
          <p>
            Articulos: <strong>{totalItems}</strong>
          </p>
          <p>
            Subtotal: <strong>{formatCOP(subtotal)}</strong>
          </p>
          <button disabled={items.length === 0} onClick={onCheckout}>
            Confirmar pedido
          </button>
        </footer>
      </aside>
    </>
  );
}
