import { Plus } from 'lucide-react';
import type { Producto } from '../types';
import { formatCOP } from '../lib/utils';

type ProductCardProps = {
  producto: Producto;
  onAdd: (producto: Producto) => void;
};

// Si el producto no tiene foto real (imagen_url vacio) o la foto no carga
// (404, backend caido, etc.), se muestra siempre el logo del negocio en vez
// de fotos de stock genericas. Mismos archivos que usa el Header, para que
// funcionen igual en dev y en produccion (respetan el "base" de Vite, que en
// GitHub Pages es /paginaliliysusazoncompleta/).
const logoFallback = `${import.meta.env.BASE_URL}logo-lili.png`;
const placeholderFallback = `${import.meta.env.BASE_URL}logo-lili-placeholder.svg`;

// Carpeta de fotos de producto, servida en vivo por el backend (ver
// backend/public/productos/README.md) tanto en dev como en produccion. Si el
// frontend y el backend quedan en dominios distintos, VITE_ASSETS_URL debe
// apuntar a la URL absoluta del backend (ej. https://api.tu-dominio.com/productos).
const ASSETS_BASE = (import.meta.env.VITE_ASSETS_URL ?? '/productos').replace(/\/$/, '');

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

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `${ASSETS_BASE}/${trimmed}`;
}

function resolveProductImage(producto: Producto) {
  return resolveImageUrl(producto.imagen_url) ?? logoFallback;
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
            if (img.dataset.fallbackStage === 'placeholder') return;
            if (img.dataset.fallbackStage === 'logo') {
              img.dataset.fallbackStage = 'placeholder';
              img.src = placeholderFallback;
              return;
            }
            img.dataset.fallbackStage = 'logo';
            img.src = logoFallback;
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
