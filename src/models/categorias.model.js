import { pool } from "../config/db.js";

const categoriaSelectFields = `
  id,
  nombre,
  slug,
  descripcion,
  imagen_url,
  imagen_public_id,
  color_hex,
  color_texto_hex,
  destacada,
  orden_destacado,
  COALESCE((
    SELECT cm.vistas
    FROM categoria_metricas cm
    WHERE cm.categoria_id = categorias.id
    LIMIT 1
  ), 0) AS visitas,
  activa,
  creado_en
`;

const categoriaPublicSelectFields = `
  id,
  nombre,
  slug,
  descripcion,
  imagen_url,
  color_hex,
  color_texto_hex,
  destacada,
  orden_destacado,
  activa,
  creado_en
`;

const categoriaColumns = [
  "nombre",
  "slug",
  "descripcion",
  "imagen_url",
  "imagen_public_id",
  "color_hex",
  "color_texto_hex",
  "destacada",
  "orden_destacado",
  "activa",
];

const CATEGORIAS_DESTACADAS_DEFAULT_LIMIT = 8;
const CATEGORIAS_DESTACADAS_LIMIT_COLUMN = "featured_categories_limit";

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

export async function obtenerResumenCategoriasAdmin() {
  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE activa = true)::int AS activas,
        COUNT(*) FILTER (WHERE activa = false)::int AS inactivas,
        COUNT(*) FILTER (WHERE destacada = true)::int AS destacadas
      FROM categorias
    `
  );

  return result.rows[0];
}

export async function listarCategoriasDestacadas(limit = 8) {
  const result = await pool.query(
    `
      SELECT ${categoriaPublicSelectFields}
      FROM categorias
      WHERE activa = true
        AND destacada = true
      ORDER BY orden_destacado ASC NULLS LAST, RANDOM()
      LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

export async function obtenerLimiteCategoriasDestacadasConfig() {
  const result = await pool.query(
    `
      SELECT ${CATEGORIAS_DESTACADAS_LIMIT_COLUMN} AS limit
      FROM home_config
      WHERE is_active = true
      ORDER BY id ASC
      LIMIT 1
    `
  );

  const limit = Number.parseInt(result.rows[0]?.limit, 10);

  return Number.isInteger(limit) && limit > 0
    ? limit
    : CATEGORIAS_DESTACADAS_DEFAULT_LIMIT;
}

export async function actualizarLimiteCategoriasDestacadasConfig(limit) {
  const result = await pool.query(
    `
      UPDATE home_config
      SET ${CATEGORIAS_DESTACADAS_LIMIT_COLUMN} = $1
      WHERE is_active = true
      RETURNING ${CATEGORIAS_DESTACADAS_LIMIT_COLUMN} AS limit
    `,
    [limit]
  );

  if (!result.rowCount) {
    return null;
  }

  return {
    limit: Number.parseInt(result.rows[0].limit, 10),
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

export async function eliminarCategoriaAdmin(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const categoriaResult = await client.query(
      `
        SELECT ${categoriaSelectFields}
        FROM categorias
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    const categoria = categoriaResult.rows[0] || null;
    if (!categoria) {
      await client.query("ROLLBACK");
      return null;
    }

    const productosResult = await client.query(
      "SELECT id FROM productos WHERE categoria_id = $1",
      [id]
    );
    const productoIds = productosResult.rows.map((row) => row.id);

    const productoImagenesResult = productoIds.length
      ? await client.query(
          `
            SELECT public_id
            FROM producto_imagenes
            WHERE producto_id = ANY($1::int[])
              AND public_id IS NOT NULL
              AND BTRIM(public_id) <> ''
          `,
          [productoIds]
        )
      : { rows: [] };

    if (productoIds.length) {
      await client.query(
        "DELETE FROM metricas_eventos_control WHERE tipo = $1 AND referencia_id = ANY($2::int[])",
        ["producto", productoIds]
      );
      await client.query(
        "DELETE FROM producto_metricas WHERE producto_id = ANY($1::int[])",
        [productoIds]
      );
      await client.query(
        "DELETE FROM producto_especificaciones WHERE producto_id = ANY($1::int[])",
        [productoIds]
      );
      await client.query(
        "DELETE FROM producto_imagenes WHERE producto_id = ANY($1::int[])",
        [productoIds]
      );
      await client.query("DELETE FROM productos WHERE id = ANY($1::int[])", [
        productoIds,
      ]);
    }

    await client.query(
      "DELETE FROM metricas_eventos_control WHERE tipo = $1 AND referencia_id = $2",
      ["categoria", id]
    );
    await client.query("DELETE FROM categoria_metricas WHERE categoria_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM categorias WHERE id = $1", [id]);

    await client.query("COMMIT");

    return {
      categoria,
      productosEliminados: productoIds.length,
      publicIds: [
        categoria.imagen_public_id,
        ...productoImagenesResult.rows.map((row) => row.public_id),
      ].filter(Boolean),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
