import type { CartItem, Categoria, ClienteForm, Producto } from '../types';

// Categorias/productos hoy se sirven desde el backend del panel admin
// (admonliliysusazoncompleta), que comparte la base de datos de produccion.
const API = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

// Chatbot, checkout (prefactura), carta en PDF, contacto y busqueda de
// cliente por telefono solo existen en el backend PROPIO de este repo
// (backend/): no estan portados a admonliliysusazoncompleta. Si no se
// define VITE_OWN_API_URL, se asume que es el mismo backend que API (util
// en dev, donde ambos corren en localhost:4000).
const OWN_API = (import.meta.env.VITE_OWN_API_URL ?? import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

const API_TIMEOUT_MS = 12_000;

function isMissingApiConfig(base: string) {
  return !base || /TU_BACKEND_PUBLICO/i.test(base);
}

function ensureProductionApiConfig(base: string, varName: string) {
  if (typeof window === 'undefined') return;

  const isGithubPages = /github\.io$/i.test(window.location.hostname);
  const isRelative = base.startsWith('/');

  if (isMissingApiConfig(base)) {
    throw new Error(
      `Configuracion faltante: define ${varName} con la URL publica de tu backend y vuelve a publicar el frontend.`,
    );
  }

  // In GitHub Pages there is no backend runtime. A relative /api URL means
  // requests are sent to github.io instead of your real API server.
  if (isGithubPages && isRelative) {
    throw new Error(
      `Configuracion faltante: define ${varName} con la URL publica de tu backend (ej. https://tu-backend.com/api) y vuelve a publicar el frontend.`,
    );
  }
}

async function fetchJson(base: string, varName: string, path: string, options?: RequestInit) {
  ensureProductionApiConfig(base, varName);

  const url = `${base}${path}`;
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
      `No se pudo conectar al backend en ${base}. Puede ser: (1) el backend esta caido o no termino de desplegar, ` +
        '(2) el backend no permite este origen por CORS (revisa FRONTEND_URL en su configuracion), o ' +
        `(3) ${varName} no es correcto. Abre la URL de arriba + /health en el navegador para confirmar si el backend responde.`,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// Rutas servidas por admonliliysusazoncompleta (VITE_API_URL).
function fetchAdminApi(path: string, options?: RequestInit) {
  return fetchJson(API, 'VITE_API_URL', path, options);
}

// Rutas servidas solo por el backend propio de este repo (VITE_OWN_API_URL).
function fetchOwnApi(path: string, options?: RequestInit) {
  return fetchJson(OWN_API, 'VITE_OWN_API_URL', path, options);
}

export async function getCategorias(): Promise<Categoria[]> {
  const res = await fetchAdminApi('/catalogo/categorias');
  if (!res.ok) throw new Error('No se pudieron cargar categorias');
  const data = await res.json();
  return data.categorias;
}

export async function getProductos(params: { categoriaId?: number; search?: string }): Promise<Producto[]> {
  const query = new URLSearchParams();
  if (params.categoriaId) query.set('categoriaId', String(params.categoriaId));
  if (params.search) query.set('search', params.search);

  const res = await fetchAdminApi(`/catalogo/productos?${query.toString()}`);
  if (!res.ok) throw new Error('No se pudo cargar el catalogo');
  const data = await res.json();
  return data.productos;
}

export async function getClienteByTelefono(telefono: string) {
  const res = await fetchOwnApi(`/clientes/by-telefono/${encodeURIComponent(telefono)}`);
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
  const res = await fetchOwnApi('/ia/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error('No se pudo contactar al asistente');
  const data = await res.json();
  return data.content;
}

export async function generarPrefactura(payload: { cliente: ClienteForm; items: CartItem[]; impuesto: number }) {
  const res = await fetchOwnApi('/pedidos/prefactura', {
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
  const res = await fetchOwnApi('/pedidos/prefactura/pdf', {
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
  return `${OWN_API}/catalogo/pdf?${query.toString()}`;
}

export async function sendContactMessage(payload: {
  nombre: string;
  telefono: string;
  correo?: string;
  mensaje: string;
}) {
  const res = await fetchOwnApi('/contacto', {
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
