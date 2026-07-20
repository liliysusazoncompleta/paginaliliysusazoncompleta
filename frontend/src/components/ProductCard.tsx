import { Plus } from 'lucide-react';
import type { Producto } from '../types';
import { formatCOP } from '../lib/utils';

type ProductCardProps = {
  producto: Producto;
  onAdd: (producto: Producto) => void;
};

// Tamano reducido (w=640, q=60) para tarjetas pequenas: se ve nitido en pantalla
// y pesa varias veces menos que las imagenes de 1200px que se usaban antes.
const IMG_PARAMS = 'auto=format&fit=crop&w=640&q=60';

const fallbackImage = `https://images.unsplash.com/photo-1547592166-23ac45744acd?${IMG_PARAMS}`;

const keywordImageMap: Array<{ keyword: RegExp; url: string }> = [
  {
    keyword: /sancocho|sopa|caldo|mondongo|tamal|lentejas|frijol/i,
    url: `https://images.unsplash.com/photo-1608500218803-4f8c2f3f88a9?${IMG_PARAMS}`,
  },
  {
    keyword: /empanada/i,
    url: `https://images.unsplash.com/photo-1604152135912-04a022e23696?${IMG_PARAMS}`,
  },
  {
    keyword: /aji|ají|salsa|picante/i,
    url: `https://images.unsplash.com/photo-1511920170033-f8396924c348?${IMG_PARAMS}`,
  },
  {
    keyword: /postre|torta|dulce|flan|natilla|buñuelo|bunuelo/i,
    url: `https://images.unsplash.com/photo-1488477181946-6428a0291777?${IMG_PARAMS}`,
  },
  {
    keyword: /arroz/i,
    url: `https://images.unsplash.com/photo-1516684732162-798a0062be99?${IMG_PARAMS}`,
  },
  {
    keyword: /pollo/i,
    url: `https://images.unsplash.com/photo-1604503468506-a8da13d82791?${IMG_PARAMS}`,
  },
  {
    keyword: /carne|res|cerdo|costilla|chuleta/i,
    url: `https://images.unsplash.com/photo-1558030006-450675393462?${IMG_PARAMS}`,
  },
];

// Carpeta de fotos de producto, servida en vivo por el backend (ver
// backend/public/productos/README.md) tanto en dev como en produccion. Si el
// frontend y el backend quedan en dominios distintos, VITE_ASSETS_URL debe
// apuntar a la URL absoluta del backend (ej. https://api.tu-dominio.com/productos).
const ASSETS_BASE = (import.meta.env.VITE_ASSETS_URL ?? '/productos').replace(/\/$/, '');

function toSafePath(pathLike: string) {
  return pathLike
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

// Acepta 3 formas en productos.imagen_url:
//  - URL externa completa: "https://..."
//  - Ruta ya absoluta: "/productos/archivo.jpg" o "https://..."
//  - Solo el nombre del archivo: "archivo.jpg" (se resuelve contra ASSETS_BASE)
function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Normaliza rutas provenientes de distintas fuentes/OS, por ejemplo:
  // "public\\productos\\foto.jpg", "backend/public/productos/foto.jpg",
  // "/productos/foto.jpg" o simplemente "foto.jpg".
  const normalized = trimmed
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^backend\//i, '')
    .replace(/^public\//i, '')
    .replace(/^productos\//i, '')
    .replace(/^\/+/, '')
    .trim();

  if (!normalized) return null;

  return `${ASSETS_BASE}/${toSafePath(normalized)}`;
}

function getImageByTitle(title: string) {
  const match = keywordImageMap.find((item) => item.keyword.test(title));
  return match ? match.url : fallbackImage;
}

function resolveProductImage(producto: Producto) {
  const local = resolveImageUrl(producto.imagen_url);
  return local ?? getImageByTitle(producto.nombre);
}

export function ProductCard({ producto, onAdd }: ProductCardProps) {
  const src = resolveProductImage(producto);

  return (
    <article className="product-card">
      <div className="image-wrap">
        <img
          src={src}
          alt={`Producto ${producto.nombre}`}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.dataset.fallbackApplied) return;
            img.dataset.fallbackApplied = 'true';
            img.src = getImageByTitle(producto.nombre);
          }}
        />
        <span className="category-tag overlay-tag">{producto.categoria}</span>
        {producto.presentacion ? (
          <span className="presentation-badge overlay-tag">{producto.presentacion}</span>
        ) : null}
      </div>
      <div className="product-content">
        <h3>{producto.nombre}</h3>
        <p>{producto.descripcion || 'Preparacion casera con el sabor especial de Lili.'}</p>

        <div className="card-foot">
          <strong>{formatCOP(producto.valor)}</strong>
          <button className="add-round-btn" onClick={() => onAdd(producto)} aria-label={`Agregar ${producto.nombre}`}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
