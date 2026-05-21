import { pool } from "../config/db.js";

const imagenSelectFields = `
  id,
  producto_id,
  imagen_url,
  public_id,
  principal,
  orden,
  creado_en
`;

const imagenColumns = ["imagen_url", "public_id", "principal", "orden"];

export async function productoImagenProductoExiste(productoId) {
  const result = await pool.query(
    "SELECT 1 FROM productos WHERE id = $1 LIMIT 1",
    [productoId]
  );

  return result.rowCount > 0;
}

export async function listarImagenesProductoAdmin(productoId) {
  const result = await pool.query(
    `
      SELECT ${imagenSelectFields}
      FROM producto_imagenes
      WHERE producto_id = $1
      ORDER BY principal DESC, orden ASC, id ASC
    `,
    [productoId]
  );

  return result.rows;
}

export async function obtenerImagenProductoAdminPorId(productoId, imagenId) {
  const result = await pool.query(
    `
      SELECT ${imagenSelectFields}
      FROM producto_imagenes
      WHERE producto_id = $1
        AND id = $2
      LIMIT 1
    `,
    [productoId, imagenId]
  );

  return result.rows[0] || null;
}

export async function crearImagenProductoAdmin(productoId, data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (data.principal) {
      await client.query(
        "UPDATE producto_imagenes SET principal = false WHERE producto_id = $1",
        [productoId]
      );
    }

    const columns = imagenColumns.filter((column) =>
      Object.prototype.hasOwnProperty.call(data, column)
    );
    const values = [productoId, ...columns.map((column) => data[column])];
    const placeholders = columns.map((_, index) => `$${index + 2}`);

    const result = await client.query(
      `
        INSERT INTO producto_imagenes (producto_id, ${columns.join(", ")})
        VALUES ($1, ${placeholders.join(", ")})
        RETURNING id
      `,
      values
    );

    const imagenResult = await client.query(
      `
        SELECT ${imagenSelectFields}
        FROM producto_imagenes
        WHERE producto_id = $1
          AND id = $2
        LIMIT 1
      `,
      [productoId, result.rows[0].id]
    );

    await client.query("COMMIT");
    return imagenResult.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarImagenProductoAdmin(productoId, imagenId, data) {
  const columns = ["orden"].filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerImagenProductoAdminPorId(productoId, imagenId);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(productoId, imagenId);

  const result = await pool.query(
    `
      UPDATE producto_imagenes
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

  return obtenerImagenProductoAdminPorId(productoId, imagenId);
}

export async function marcarImagenProductoAdminPrincipal(productoId, imagenId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE producto_imagenes SET principal = false WHERE producto_id = $1",
      [productoId]
    );

    const result = await client.query(
      `
        UPDATE producto_imagenes
        SET principal = true
        WHERE producto_id = $1
          AND id = $2
        RETURNING id
      `,
      [productoId, imagenId]
    );

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return null;
    }

    const imagenResult = await client.query(
      `
        SELECT ${imagenSelectFields}
        FROM producto_imagenes
        WHERE producto_id = $1
          AND id = $2
        LIMIT 1
      `,
      [productoId, imagenId]
    );

    await client.query("COMMIT");
    return imagenResult.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function reemplazarImagenProductoAdmin(productoId, imagenId, data) {
  const result = await pool.query(
    `
      UPDATE producto_imagenes
      SET imagen_url = $1,
          public_id = $2
      WHERE producto_id = $3
        AND id = $4
      RETURNING id
    `,
    [data.imagen_url, data.public_id, productoId, imagenId]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerImagenProductoAdminPorId(productoId, imagenId);
}

export async function eliminarImagenProductoAdmin(productoId, imagenId) {
  const result = await pool.query(
    `
      DELETE FROM producto_imagenes
      WHERE producto_id = $1
        AND id = $2
      RETURNING ${imagenSelectFields}
    `,
    [productoId, imagenId]
  );

  return result.rows[0] || null;
}
