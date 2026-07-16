import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../lib/CartContext';
import { getProductos } from '../lib/api';
import type { Producto } from '../types';

export function CatalogPage() {
  const {
    categorias,
    productos,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    loading,
    error,
    addToCart,
    downloadCatalog,
  } = useCart();

  const [allProductos, setAllProductos] = useState<Producto[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getProductos({});
        setAllProductos(data);
      } catch {
        setAllProductos([]);
      }
    })();
  }, []);

  const countFor = (id?: number) =>
    id ? allProductos.filter((item) => item.id_tipo_producto === id).length : allProductos.length;

  return (
    <>
      <div className="catalog-header">
        <div>
          <h1>Nuestro Catalogo de Productos</h1>
          <p>Elaborado con amor, directo a tu mesa. Sin aditivos artificiales.</p>
        </div>
        <button className="download-pdf-btn" onClick={() => void downloadCatalog()}>
          <Download size={16} /> Descargar Carta PDF
        </button>
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <label className="sidebar-search-label" htmlFor="catalog-search">
            ¿Que te provoca hoy, mi cielo?
          </label>
          <div className="sidebar-search">
            <Search size={16} />
            <input
              id="catalog-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar platos o sazones..."
            />
          </div>

          <h3 className="sidebar-title">Categorias</h3>
          <div className="category-vertical-list">
            <button
              className={!selectedCategory ? 'category-row active' : 'category-row'}
              onClick={() => setSelectedCategory(undefined)}
            >
              <span>Todos</span>
              <span className="count-pill">{countFor()}</span>
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id_tipo_producto}
                className={selectedCategory === cat.id_tipo_producto ? 'category-row active' : 'category-row'}
                onClick={() => setSelectedCategory(cat.id_tipo_producto)}
              >
                <span>{cat.nombre}</span>
                <span className="count-pill">{countFor(cat.id_tipo_producto)}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="catalog-main">
          {loading ? <p>Cargando productos...</p> : null}
          {!loading && error ? <p className="error-text">{error}</p> : null}
          {!loading && !error && productos.length === 0 ? (
            <p>No encontramos productos con ese filtro. Prueba otra categoria o cambia la busqueda.</p>
          ) : null}

          {!loading && !error ? (
            <div className="products-grid catalog-grid">
              {productos.map((producto) => (
                <ProductCard key={producto.id_producto} producto={producto} onAdd={addToCart} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
