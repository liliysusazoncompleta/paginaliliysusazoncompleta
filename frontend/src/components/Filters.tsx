import type { Categoria } from '../types';

type FiltersProps = {
  categorias: Categoria[];
  selectedCategory?: number;
  search: string;
  onCategoryChange: (id?: number) => void;
  onSearchChange: (value: string) => void;
  onDownloadCatalog: () => void;
};

export function Filters({
  categorias,
  selectedCategory,
  search,
  onCategoryChange,
  onSearchChange,
  onDownloadCatalog,
}: FiltersProps) {
  return (
    <aside className="filters-card">
      <h2>Explora el catalogo</h2>

      <label htmlFor="search">Buscar producto</label>
      <input
        id="search"
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Ej. Sazon premium"
      />

      <div className="category-list" role="radiogroup" aria-label="Categorias">
        <button
          className={!selectedCategory ? 'chip active' : 'chip'}
          onClick={() => onCategoryChange(undefined)}
        >
          Ver todos
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id_tipo_producto}
            className={selectedCategory === cat.id_tipo_producto ? 'chip active' : 'chip'}
            onClick={() => onCategoryChange(cat.id_tipo_producto)}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      <button className="outline-btn" onClick={onDownloadCatalog}>
        Descargar carta (PDF)
      </button>
    </aside>
  );
}
