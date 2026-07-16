import type { CartItem, Categoria, ClienteForm, Producto } from '../types';

const API = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const API_TIMEOUT_MS = 12_000;

function isMissingProductionApiConfig() {
  return !API || /TU_BACKEND_PUBLICO/i.test(API);
}

function ensureProductionApiConfig() {
  if (typeof window === 'undefined') return;

  const isGithubPages = /github\.io$/i.test(window.location.hostname);
  const isRelativeApi = API.startsWith('/');

  if (isMissingProductionApiConfig()) {
    throw new Error(
      'Configuracion faltante: define VITE_API_URL con la URL publica de tu backend y vuelve a publicar el frontend.',
    );
  }

  // In GitHub Pages there is no backend runtime. A relative /api URL means
  // requests are sent to github.io instead of your real API server.
  if (isGithubPages && isRelativeApi) {
    throw new Error(
      'Configuracion faltante: define VITE_API_URL con la URL publica de tu backend (ej. https://tu-backend.com/api) y vuelve a publicar el frontend.',
    );
  }
}

async function fetchJson(url: string, options?: RequestInit) {
  ensureProductionApiConfig();

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('El backend tardo demasiado en responder. Si esta en Render o Railway, espera a que despierte e intenta de nuevo.');
    }

    throw new Error(
      `No se pudo conectar al backend en ${API}. Puede ser: (1) el backend esta caido o no termino de desplegar, ` +
        '(2) el backend no permite este origen por CORS (revisa FRONTEND_URL en su configuracion), o ' +
        '(3) VITE_API_URL no es correcto. Abre la URL de arriba + /health en el navegador para confirmar si el backend responde.',
    );
  } finally {
    window.clearTimeout(timeoutId);
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
