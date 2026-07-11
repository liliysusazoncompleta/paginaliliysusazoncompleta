import type { CartItem, Categoria, ClienteForm, Producto } from '../types';

const API = import.meta.env.VITE_API_URL ?? '/api';

async function fetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch {
    throw new Error('No se pudo conectar al backend. Verifica que el servidor este activo en http://localhost:4000 y ejecuta pnpm dev desde la raiz.');
  }
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await fetchJson(`${API}/catalogo/categorias`);
  if (!res.ok) throw new Error('No se pudieron cargar categorias');
  const data = await res.json();
  return data.categorias;
}

export async function getProductos(params: { categoriaId?: number; search?: string }): Promise<Producto[]> {
  const query = new URLSearchParams();
  if (params.categoriaId) query.set('categoriaId', String(params.categoriaId));
  if (params.search) query.set('search', params.search);

  const res = await fetchJson(`${API}/catalogo/productos?${query.toString()}`);
  if (!res.ok) throw new Error('No se pudo cargar el catalogo');
  const data = await res.json();
  return data.productos;
}

export async function getClienteByTelefono(telefono: string) {
  const res = await fetchJson(`${API}/clientes/by-telefono/${encodeURIComponent(telefono)}`);
  if (!res.ok) throw new Error('No se pudo consultar cliente');
  return (await res.json()).cliente as
    | {
        nombre: string;
        telefono: string;
        direccion_principal: string | null;
        direccion_alterna: string | null;
      }
    | null;
}

export async function getChatbotAnswer(message: string): Promise<string> {
  const res = await fetchJson(`${API}/ia/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error('No se pudo contactar al asistente');
  const data = await res.json();
  return data.content;
}

export async function generarPrefactura(payload: { cliente: ClienteForm; items: CartItem[]; impuesto: number }) {
  const res = await fetchJson(`${API}/pedidos/prefactura`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('No se pudo generar la prefactura');
  return res.json() as Promise<{
    referencia: string;
    archivoNombre: string;
    subtotal: number;
    impuesto: number;
    total: number;
    whatsappUrl: string;
  }>;
}

export async function descargarPrefacturaPdf(payload: {
  cliente: ClienteForm;
  items: CartItem[];
  impuesto: number;
}) {
  const res = await fetchJson(`${API}/pedidos/prefactura/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('No se pudo descargar prefactura');
  return res.blob();
}

export function getCatalogoPdfUrl(params: { categoriaId?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params.categoriaId) query.set('categoriaId', String(params.categoriaId));
  if (params.search) query.set('search', params.search);
  return `${API}/catalogo/pdf?${query.toString()}`;
}

export async function sendContactMessage(payload: {
  nombre: string;
  telefono: string;
  correo?: string;
  mensaje: string;
}) {
  const res = await fetchJson(`${API}/contacto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'No fue posible enviar el mensaje');
  }

  return res.json();
}
