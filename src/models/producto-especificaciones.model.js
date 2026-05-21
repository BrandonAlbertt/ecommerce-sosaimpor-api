import { pool } from "../config/db.js";

const especificacionSelectFields = `
  id,
  producto_id,
  nombre,
  valor
`;

const especificacionColumns = ["nombre", "valor"];

export async function productoEspecificacionProductoExiste(productoId) {
  const result = await pool.query(
    "SELECT 1 FROM productos WHERE id = $1 LIMIT 1",
    [productoId]
  );

  return result.rowCount > 0;
}

export async function listarEspecificacionesProductoAdmin(productoId) {
  const result = await pool.query(
    `
      SELECT ${especificacionSelectFields}
      FROM producto_especificaciones
      WHERE producto_id = $1
      ORDER BY id ASC
    `,
    [productoId]
  );

  return result.rows;
}

export async function obtenerEspecificacionProductoAdminPorId(
  productoId,
  especificacionId
) {
  const result = await pool.query(
    `
      SELECT ${especificacionSelectFields}
      FROM producto_especificaciones
      WHERE producto_id = $1
        AND id = $2
      LIMIT 1
    `,
    [productoId, especificacionId]
  );

  return result.rows[0] || null;
}

export async function crearEspecificacionProductoAdmin(productoId, data) {
  const columns = especificacionColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );
  const values = [productoId, ...columns.map((column) => data[column])];
  const placeholders = columns.map((_, index) => `$${index + 2}`);

  const result = await pool.query(
    `
      INSERT INTO producto_especificaciones (producto_id, ${columns.join(", ")})
      VALUES ($1, ${placeholders.join(", ")})
      RETURNING id
    `,
    values
  );

  return obtenerEspecificacionProductoAdminPorId(
    productoId,
    result.rows[0].id
  );
}

export async function actualizarEspecificacionProductoAdmin(
  productoId,
  especificacionId,
  data
) {
  const columns = especificacionColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerEspecificacionProductoAdminPorId(productoId, especificacionId);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(productoId, especificacionId);

  const result = await pool.query(
    `
      UPDATE producto_especificaciones
      SET ${setSQL}
      WHERE producto_id = $${values.length - 1}
        AND id = $${values.length}
      RETURNING id
    `,
    values
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerEspecificacionProductoAdminPorId(productoId, especificacionId);
}

export async function eliminarEspecificacionProductoAdmin(
  productoId,
  especificacionId
) {
  const result = await pool.query(
    `
      DELETE FROM producto_especificaciones
      WHERE producto_id = $1
        AND id = $2
      RETURNING ${especificacionSelectFields}
    `,
    [productoId, especificacionId]
  );

  return result.rows[0] || null;
}
