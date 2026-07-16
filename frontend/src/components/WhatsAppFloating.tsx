import { MessageCircleMore } from 'lucide-react';
import type { CartItem, ClienteForm } from '../types';
import { formatCOP } from '../lib/utils';

type WhatsAppFloatingProps = {
  items: CartItem[];
  cliente: Partial<ClienteForm>;
};

const phone = import.meta.env.VITE_WHATSAPP_PHONE ?? '573177719249';

export function WhatsAppFloating({ items, cliente }: WhatsAppFloatingProps) {
  const subtotal = items.reduce((acc, item) => acc + item.valor * item.cantidad, 0);
  const lines = items.length
    ? items.map((item) => `- ${item.nombre} x${item.cantidad}`).join('\n')
    : '- Aun sin productos';

  const message = [
    'Hola Lili, quiero hacer un pedido:',
    lines,
    `Total estimado: ${formatCOP(subtotal)}`,
    `Nombre: ${cliente.nombre ?? ''}`,
    `Direccion de entrega: ${cliente.direccion ?? ''}`,
    `Fecha y hora de entrega: ${cliente.fechaEntrega ?? ''} ${cliente.horaEntrega ?? ''}`,
  ].join('\n');

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a href={url} className="wa-floating" target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp">
      <MessageCircleMore size={20} /> WhatsApp
    </a>
  );
}
