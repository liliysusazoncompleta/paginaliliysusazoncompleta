import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import type { CartItem, ClienteForm } from '../types';
import { formatCOP } from '../lib/utils';
import { descargarPrefacturaPdf, generarPrefactura, getClienteByTelefono } from '../lib/api';

type CheckoutModalProps = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onConfirmed: () => void;
};

const initialForm: ClienteForm = {
  nombre: '',
  telefono: '',
  direccion: '',
  fechaEntrega: '',
  horaEntrega: '',
  observaciones: '',
};

export function CheckoutModal({ open, items, onClose, onConfirmed }: CheckoutModalProps) {
  const [form, setForm] = useState<ClienteForm>(initialForm);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setError(null);
      setLoadingCliente(false);
      setSending(false);
    }
  }, [open]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.valor * item.cantidad, 0), [items]);
  const impuesto = useMemo(() => 0, []);
  const total = subtotal + impuesto;

  async function tryAutofill(telefono: string) {
    if (telefono.trim().length < 7) return;
    setLoadingCliente(true);
    setError(null);

    try {
      const cliente = await getClienteByTelefono(telefono.trim());
      if (cliente) {
        setForm((prev) => ({
          ...prev,
          nombre: cliente.nombre || prev.nombre,
          telefono: cliente.telefono || prev.telefono,
          direccion: cliente.direccion_alterna || cliente.direccion_principal || prev.direccion,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible consultar el telefono');
    } finally {
      setLoadingCliente(false);
    }
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const prefactura = await generarPrefactura({ cliente: form, items, impuesto });
      const pdfBlob = await descargarPrefacturaPdf({ cliente: form, items, impuesto });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prefactura-${prefactura.referencia}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      window.open(prefactura.whatsappUrl, '_blank', 'noopener,noreferrer');
      onConfirmed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible confirmar el pedido');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <button className="overlay" onClick={onClose} aria-label="Cerrar checkout" />
      <section className="checkout-modal">
        <header>
          <h2 id="checkout-title">Confirmar pedido</h2>
          <button onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={submitOrder}>
          <div className="form-grid">
            <label>
              Nombre completo*
              <input
                required
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </label>

            <label>
              Telefono*
              <div className="phone-field">
                <input
                  required
                  value={form.telefono}
                  onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
                  onBlur={(event) => void tryAutofill(event.target.value)}
                />
                {loadingCliente && <LoaderCircle size={16} className="spin" />}
              </div>
            </label>

            <label className="full-width">
              Direccion de entrega*
              <input
                required
                value={form.direccion}
                onChange={(event) => setForm((prev) => ({ ...prev, direccion: event.target.value }))}
                placeholder="Puedes cambiarla aunque venga precargada"
              />
            </label>

            <label>
              Fecha de entrega*
              <input
                required
                type="date"
                value={form.fechaEntrega}
                onChange={(event) => setForm((prev) => ({ ...prev, fechaEntrega: event.target.value }))}
              />
            </label>

            <label>
              Hora de entrega*
              <input
                required
                type="time"
                value={form.horaEntrega}
                onChange={(event) => setForm((prev) => ({ ...prev, horaEntrega: event.target.value }))}
              />
            </label>
          </div>

          <section className="checkout-summary">
            <h3>Resumen</h3>
            {items.map((item) => (
              <p key={item.id_producto}>
                {item.nombre} x{item.cantidad} <span>{formatCOP(item.valor * item.cantidad)}</span>
              </p>
            ))}
            <p>
              Subtotal <strong>{formatCOP(subtotal)}</strong>
            </p>
            <p>
              Impuesto <strong>{formatCOP(impuesto)}</strong>
            </p>
            <p className="total-line">
              Total <strong>{formatCOP(total)}</strong>
            </p>
          </section>

          {error && <p className="error-text">{error}</p>}

          <button disabled={sending || items.length === 0} type="submit" className="primary-submit">
            {sending ? 'Procesando...' : 'Generar prefactura y enviar a WhatsApp'}
          </button>
        </form>
      </section>
    </div>
  );
}
