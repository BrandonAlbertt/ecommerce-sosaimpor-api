import { pool } from "../config/db.js";

const categoriaMetricaSelectFields = `
  cm.id,
  cm.categoria_id,
  c.nombre AS categoria_nombre,
  c.slug AS categoria_slug,
  cm.vistas,
  cm.creado_en,
  cm.actualizado_en
`;

const metricColumns = ["vistas"];

export async function listarCategoriaMetricas() {
  const result = await pool.query(
    `
      SELECT ${categoriaMetricaSelectFields}
      FROM categoria_metricas cm
      INNER JOIN categorias c ON c.id = cm.categoria_id
      ORDER BY cm.actualizado_en DESC, cm.id DESC
    `
  );

  return result.rows;
}

export async function obtenerCategoriaMetricaPorCategoriaId(categoriaId) {
  const result = await pool.query(
    `
      SELECT ${categoriaMetricaSelectFields}
      FROM categoria_metricas cm
      INNER JOIN categorias c ON c.id = cm.categoria_id
      WHERE cm.categoria_id = $1
      LIMIT 1
    `,
    [categoriaId]
  );

  return result.rows[0] || null;
}

export async function asegurarCategoriaMetrica(categoriaId) {
  await pool.query(
    `
      INSERT INTO categoria_metricas (categoria_id)
      VALUES ($1)
      ON CONFLICT (categoria_id) DO NOTHING
    `,
    [categoriaId]
  );

  return obtenerCategoriaMetricaPorCategoriaId(categoriaId);
}

export async function incrementarVistasCategoriaMetrica(categoriaId) {
  const result = await pool.query(
    `
      INSERT INTO categoria_metricas (categoria_id, vistas)
      VALUES ($1, 1)
      ON CONFLICT (categoria_id) DO UPDATE
      SET
        vistas = categoria_metricas.vistas + 1,
        actualizado_en = NOW()
      RETURNING categoria_id
    `,
    [categoriaId]
  );

  return obtenerCategoriaMetricaPorCategoriaId(result.rows[0].categoria_id);
}

export async function actualizarCategoriaMetrica(categoriaId, data) {
  const columns = metricColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerCategoriaMetricaPorCategoriaId(categoriaId);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(categoriaId);

  const result = await pool.query(
    `
      UPDATE categoria_metricas
      SET
        ${setSQL},
        actualizado_en = NOW()
      WHERE categoria_id = $${values.length}
      RETURNING categoria_id
    `,
    values
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerCategoriaMetricaPorCategoriaId(categoriaId);
}

export async function resetearCategoriaMetrica(categoriaId) {
  const result = await pool.query(
    `
      UPDATE categoria_metricas
      SET
        vistas = 0,
        actualizado_en = NOW()
      WHERE categoria_id = $1
      RETURNING categoria_id
    `,
    [categoriaId]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerCategoriaMetricaPorCategoriaId(categoriaId);
}

export async function eliminarCategoriaMetrica(categoriaId) {
  const result = await pool.query(
    `
      DELETE FROM categoria_metricas
      WHERE categoria_id = $1
      RETURNING id,
        categoria_id,
        vistas,
        creado_en,
        actualizado_en
    `,
    [categoriaId]
  );

  return result.rows[0] || null;
}
