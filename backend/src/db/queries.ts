import { pool } from './pool.js';
import type { Categoria, Cliente, Producto } from '../types.js';

// Categorias administrativas/internas que nunca deben verse en la tienda
// publica (ni en el filtro de categorias, ni en el catalogo, ni en la carta
// PDF). Comparacion insensible a mayusculas/acentos simples.
const HIDDEN_CATEGORIES = ['negocio', 'domicilio', 'combos', 'otros'];

export async function getCategorias(): Promise<Categoria[]> {
  const { rows } = await pool.query<Categoria>(
    `
      SELECT id_tipo_producto, nombre, descripcion
      FROM tipo_producto
      WHERE activo = true
        AND lower(nombre) <> ALL($1::text[])
      ORDER BY nombre ASC
    `,
    [HIDDEN_CATEGORIES],
  );

  return rows;
}

export async function getProductos(params: {
  categoriaId?: number;
  search?: string;
}): Promise<Producto[]> {
  const values: Array<string | number | string[]> = [HIDDEN_CATEGORIES];
  const where: string[] = ['p.activo = true', 'tp.activo = true', 'lower(tp.nombre) <> ALL($1::text[])'];

  if (params.categoriaId) {
    values.push(params.categoriaId);
    where.push(`p.id_tipo_producto = $${values.length}`);
  }

  if (params.search) {
    values.push(`%${params.search}%`);
    where.push(`p.nombre ILIKE $${values.length}`);
  }

  const { rows } = await pool.query<Producto>(
    `
      SELECT
        p.id_producto,
        p.codigo,
        p.nombre,
        p.id_tipo_producto,
        tp.nombre AS categoria,
        p.presentacion,
        p.valor,
        p.descripcion,
        p.imagen_url
      FROM productos p
      JOIN tipo_producto tp ON p.id_tipo_producto = tp.id_tipo_producto
      WHERE ${where.join(' AND ')}
      ORDER BY p.nombre ASC
    `,
    values,
  );

  return rows.map((row: Producto) => ({
    ...row,
    valor: Number(row.valor),
  }));
}

export async function getClienteByTelefono(telefono: string): Promise<Cliente | null> {
  const normalized = telefono.replace(/\D/g, '');
  if (!normalized) {
    return null;
  }

  const { rows } = await pool.query<Cliente>(
    `
      SELECT
        id_cliente,
        nombre,
        telefono,
        telefono_alt,
        direccion_principal,
        direccion_alterna,
        observaciones
      FROM clientes
      WHERE activo = true
        AND (
          RIGHT(regexp_replace(COALESCE(telefono, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
          OR RIGHT(regexp_replace(COALESCE(telefono_alt, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
        )
      ORDER BY CASE
        WHEN RIGHT(regexp_replace(COALESCE(telefono, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
          THEN 0
        ELSE 1
      END,
      id_cliente DESC
      LIMIT 1
    `,
    [normalized],
  );

  return rows[0] ?? null;
}
