import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { buildPrefacturaPdf } from '../services/pdf.js';

const prefacturaSchema = z.object({
  cliente: z.object({
    nombre: z.string().trim().min(3),
    telefono: z.string().trim().min(7),
    direccion: z.string().trim().min(5),
    fechaEntrega: z.string().trim().min(4),
    horaEntrega: z.string().trim().min(2),
    observaciones: z.string().trim().max(500).optional().default(''),
  }),
  items: z
    .array(
      z.object({
        id_producto: z.number(),
        nombre: z.string(),
        presentacion: z.string(),
        valor: z.number().nonnegative(),
        cantidad: z.number().int().positive(),
      }),
    )
    .min(1),
  impuesto: z.number().nonnegative().default(0),
});

function money(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

const DIACRITICS_RE = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

// "Monica Arango" -> "monica_arango"
function slugifyName(name: string) {
  return name
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// nombre del archivo: "monica_arango_10072026.pdf" (nombre del cliente + fecha de hoy en DDMMYYYY).
function buildInvoiceFilename(nombreCliente: string) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const slug = slugifyName(nombreCliente) || 'pedido';
  return `${slug}_${dd}${mm}${yyyy}.pdf`;
}

function buildWhatsAppMessage(payload: z.infer<typeof prefacturaSchema>, referencia: string) {
  const subtotal = payload.items.reduce((acc, item) => acc + item.valor * item.cantidad, 0);
  const total = subtotal + payload.impuesto;

  const lines = payload.items
    .map((item) => `- ${item.nombre} (${item.presentacion}) x${item.cantidad} = ${money(item.valor * item.cantidad)}`)
    .join('\n');

  return [
    'Hola Lili, quiero hacer un pedido:',
    lines,
    `Subtotal: ${money(subtotal)}`,
    `Impuestos: ${money(payload.impuesto)}`,
    `Total: ${money(total)}`,
    `Nombre: ${payload.cliente.nombre}`,
    `Telefono: ${payload.cliente.telefono}`,
    `Direccion de entrega: ${payload.cliente.direccion}`,
    `Fecha y hora de entrega: ${payload.cliente.fechaEntrega} a las ${payload.cliente.horaEntrega}`,
    `Observaciones: ${payload.cliente.observaciones || 'Sin observaciones'}`,
    `Referencia: ${referencia}`,
  ].join('\n');
}

export const ordersRouter = Router();

ordersRouter.post('/prefactura', async (req, res, next) => {
  try {
    const payload = prefacturaSchema.parse(req.body);
    const referencia = `WEB-${Date.now()}`;
    const subtotal = payload.items.reduce((acc, item) => acc + item.valor * item.cantidad, 0);
    const total = subtotal + payload.impuesto;
    const whatsappMessage = buildWhatsAppMessage(payload, referencia);
    const whatsappUrl = `https://wa.me/${env.whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    const archivoNombre = buildInvoiceFilename(payload.cliente.nombre);

    res.json({
      referencia,
      archivoNombre,
      subtotal,
      impuesto: payload.impuesto,
      total,
      whatsappUrl,
      preview: payload,
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/prefactura/pdf', async (req, res, next) => {
  try {
    const payload = prefacturaSchema.parse(req.body);
    const referencia = `WEB-${Date.now()}`;
    const pdfBytes = await buildPrefacturaPdf(payload, referencia);
    const archivoNombre = buildInvoiceFilename(payload.cliente.nombre);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${archivoNombre}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    next(error);
  }
});
