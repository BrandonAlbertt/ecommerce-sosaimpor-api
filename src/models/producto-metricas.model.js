import { pool } from "../config/db.js";

const productoMetricaSelectFields = `
  pm.id,
  pm.producto_id,
  p.nombre AS producto_nombre,
  p.slug AS producto_slug,
  pm.vistas,
  pm.creado_en,
  pm.actualizado_en
`;

const metricColumns = ["vistas"];

export async function listarProductoMetricas() {
  const result = await pool.query(
    `
      SELECT ${productoMetricaSelectFields}
      FROM producto_metricas pm
      INNER JOIN productos p ON p.id = pm.producto_id
      ORDER BY pm.actualizado_en DESC, pm.id DESC
    `
  );

  return result.rows;
}

export async function obtenerProductoMetricaPorProductoId(productoId) {
  const result = await pool.query(
    `
      SELECT ${productoMetricaSelectFields}
      FROM producto_metricas pm
      INNER JOIN productos p ON p.id = pm.producto_id
      WHERE pm.producto_id = $1
      LIMIT 1
    `,
    [productoId]
  );

  return result.rows[0] || null;
}

export async function asegurarProductoMetrica(productoId) {
  await pool.query(
    `
      INSERT INTO producto_metricas (producto_id)
      VALUES ($1)
      ON CONFLICT (producto_id) DO NOTHING
    `,
    [productoId]
  );

  return obtenerProductoMetricaPorProductoId(productoId);
}

export async function incrementarVistasProductoMetrica(productoId) {
  const result = await pool.query(
    `
      INSERT INTO producto_metricas (producto_id, vistas)
      VALUES ($1, 1)
      ON CONFLICT (producto_id) DO UPDATE
      SET
        vistas = producto_metricas.vistas + 1,
        actualizado_en = NOW()
      RETURNING producto_id
    `,
    [productoId]
  );

  return obtenerProductoMetricaPorProductoId(result.rows[0].producto_id);
}

export async function actualizarProductoMetrica(productoId, data) {
  const columns = metricColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerProductoMetricaPorProductoId(productoId);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(productoId);

  const result = await pool.query(
    `
      UPDATE producto_metricas
      SET
        ${setSQL},
        actualizado_en = NOW()
      WHERE producto_id = $${values.length}
      RETURNING producto_id
    `,
    values
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerProductoMetricaPorProductoId(productoId);
}

export async function resetearProductoMetrica(productoId) {
  const result = await pool.query(
    `
      UPDATE producto_metricas
      SET
        vistas = 0,
        actualizado_en = NOW()
      WHERE producto_id = $1
      RETURNING producto_id
    `,
    [productoId]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerProductoMetricaPorProductoId(productoId);
}

export async function eliminarProductoMetrica(productoId) {
  const result = await pool.query(
    `
      DELETE FROM producto_metricas
      WHERE producto_id = $1
      RETURNING id,
        producto_id,
        vistas,
        creado_en,
        actualizado_en
    `,
    [productoId]
  );

  return result.rows[0] || null;
}
