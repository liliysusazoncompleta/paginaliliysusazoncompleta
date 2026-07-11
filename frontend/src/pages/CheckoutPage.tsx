import { CalendarDays, Minus, Plus, Receipt, ShieldCheck, ShoppingBasket, Trash2, User } from 'lucide-react';
import { useCart } from '../lib/CartContext';
import { formatCOP } from '../lib/utils';

export function CheckoutPage() {
  const {
    cart,
    subtotal,
    domicilio,
    total,
    increaseQty,
    decreaseQty,
    removeItem,
    form,
    setForm,
    autofillByPhone,
    sending,
    submitOrder,
  } = useCart();

  return (
    <>
      <div className="checkout-header">
        <h1>Finaliza tu Pedido</h1>
        <p>Revisa tus deliciosos platos y completa los datos de entrega para enviarlos a nuestro WhatsApp.</p>
      </div>

      <div className="checkout-layout">
        <div className="checkout-left">
          <section className="panel-card">
            <h2>
              <Receipt size={20} /> Resumen del Pedido
            </h2>

            {cart.length === 0 ? (
              <div className="empty-cart-block">
                <ShoppingBasket size={34} />
                <p>Tu carrito esta vacio, mi cielo.</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <article key={item.id_producto} className="checkout-item-row">
                    <div className="checkout-item-thumb" aria-hidden>
                      {item.nombre.slice(0, 1)}
                    </div>

                    <div>
                      <h3>{item.nombre}</h3>
                      <p>{item.presentacion}</p>
                    </div>

                    <div className="inline-qty-control">
                      <button onClick={() => decreaseQty(item.id_producto)} aria-label="Restar">
                        <Minus size={13} />
                      </button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => increaseQty(item.id_producto)} aria-label="Sumar">
                        <Plus size={13} />
                      </button>
                    </div>

                    <strong>{formatCOP(item.valor * item.cantidad)}</strong>

                    <button className="mini-delete" onClick={() => removeItem(item.id_producto)}>
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))}

                <div className="checkout-totals">
                  <p>
                    Subtotal <span>{formatCOP(subtotal)}</span>
                  </p>
                  <p>
                    Domicilio <span>{formatCOP(domicilio)}</span>
                  </p>
                  <h3>
                    Total <span>{formatCOP(total)}</span>
                  </h3>
                </div>
              </>
            )}

            <div className="secure-badge">
              <ShieldCheck size={14} /> Tus datos estan seguros
            </div>
          </section>
        </div>

        <section className="panel-card checkout-form-card">
          <h2>
            <User size={20} /> Datos Personales
          </h2>

          <div className="delivery-grid">
            <label>
              Telefono*
              <input
                required
                placeholder="+123 456 7890"
                value={form.telefono}
                onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
                onBlur={(event) => void autofillByPhone(event.target.value)}
              />
            </label>
            <label>
              Nombre Completo*
              <input
                required
                placeholder="Ej. Maria Perez"
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </label>
            <label className="full-width">
              Direccion de Entrega*
              <textarea
                required
                rows={2}
                placeholder="Calle, Numero, Sector, Referencia o indicaciones..."
                value={form.direccion}
                onChange={(event) => setForm((prev) => ({ ...prev, direccion: event.target.value }))}
              />
            </label>
            <label className="full-width">
              Observaciones adicionales (Opcional)
              <textarea
                rows={2}
                placeholder="Ej. Sin cebolla, tocar el timbre fuerte, dejar con el portero..."
                value={form.observaciones}
                onChange={(event) => setForm((prev) => ({ ...prev, observaciones: event.target.value }))}
              />
            </label>
          </div>

          <h3 className="program-heading">
            <CalendarDays size={18} /> Programar Entrega
          </h3>

          <div className="delivery-grid">
            <label>
              Fecha
              <input
                type="date"
                value={form.fechaEntrega}
                onChange={(event) => setForm((prev) => ({ ...prev, fechaEntrega: event.target.value }))}
              />
            </label>
            <label>
              Hora Estimada
              <input
                type="time"
                value={form.horaEntrega}
                onChange={(event) => setForm((prev) => ({ ...prev, horaEntrega: event.target.value }))}
              />
            </label>
          </div>

          <button className="summary-button" onClick={() => void submitOrder()} disabled={sending}>
            {sending ? 'Generando...' : 'Generar Pedido y Enviar por WhatsApp'}
          </button>
          <small className="checkout-disclaimer">
            * Al confirmar, se genera prefactura PDF y enlace a WhatsApp.
          </small>
        </section>
      </div>
    </>
  );
}
