import { pool } from "../config/db.js";

const categoriaSelectFields = `
  id,
  nombre,
  slug,
  descripcion,
  imagen_url,
  color_hex,
  color_texto_hex,
  destacada,
  orden_destacado,
  visitas,
  activa,
  creado_en
`;

const categoriaColumns = [
  "nombre",
  "slug",
  "descripcion",
  "imagen_url",
  "color_hex",
  "color_texto_hex",
  "destacada",
  "orden_destacado",
  "activa",
];

export async function listarCategoriasAdminFiltradas(filters, pagination) {
  const values = [];
  const where = [];

  if (filters.activa !== null) {
    values.push(filters.activa);
    where.push(`activa = $${values.length}`);
  }

  if (filters.destacada !== null) {
    values.push(filters.destacada);
    where.push(`destacada = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    where.push(`
      (
        nombre ILIKE $${values.length}
        OR slug ILIKE $${values.length}
        OR descripcion ILIKE $${values.length}
      )
    `);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM categorias
    ${whereSQL}
  `;

  const totalResult = await pool.query(countQuery, values);
  const total = totalResult.rows[0].total;

  values.push(pagination.limit);
  const limitIndex = values.length;

  values.push(pagination.offset);
  const offsetIndex = values.length;

  const dataQuery = `
    SELECT ${categoriaSelectFields}
    FROM categorias
    ${whereSQL}
    ORDER BY destacada DESC, orden_destacado ASC, creado_en DESC, id DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const categoriasResult = await pool.query(dataQuery, values);

  return {
    categorias: categoriasResult.rows,
    total,
  };
}

export async function obtenerCategoriaAdminPorId(id) {
  const result = await pool.query(
    `
      SELECT ${categoriaSelectFields}
      FROM categorias
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function crearCategoriaAdmin(data) {
  const columns = categoriaColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );
  const values = columns.map((column) => data[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);

  const result = await pool.query(
    `
      INSERT INTO categorias (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING id
    `,
    values
  );

  return obtenerCategoriaAdminPorId(result.rows[0].id);
}

export async function actualizarCategoriaAdmin(id, data) {
  const columns = categoriaColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerCategoriaAdminPorId(id);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(id);

  const result = await pool.query(
    `
      UPDATE categorias
      SET ${setSQL}
      WHERE id = $${values.length}
      RETURNING id
    `,
    values
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerCategoriaAdminPorId(id);
}

export async function desactivarCategoriaAdmin(id) {
  const result = await pool.query(
    "UPDATE categorias SET activa = false WHERE id = $1 RETURNING id",
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerCategoriaAdminPorId(id);
}

export async function activarCategoriaAdmin(id) {
  const result = await pool.query(
    "UPDATE categorias SET activa = true WHERE id = $1 RETURNING id",
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerCategoriaAdminPorId(id);
}
