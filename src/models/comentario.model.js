import { pool } from "../config/db.js";

const comentarioSelectFields = `
  id,
  texto,
  creado_en
`;

const comentarioColumns = ["texto", "ip_hash", "user_agent_hash"];

export async function listarComentariosPagina() {
  const result = await pool.query(
    `
      SELECT ${comentarioSelectFields}
      FROM comentarios_pagina
      ORDER BY creado_en DESC, id DESC
    `
  );

  return result.rows;
}

export async function obtenerComentarioPaginaPorId(id) {
  const result = await pool.query(
    `
      SELECT ${comentarioSelectFields}
      FROM comentarios_pagina
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function crearComentarioPagina(data) {
  const columns = comentarioColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );
  const values = columns.map((column) => data[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);

  const result = await pool.query(
    `
      INSERT INTO comentarios_pagina (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING id
    `,
    values
  );

  return obtenerComentarioPaginaPorId(result.rows[0].id);
}

export async function contarComentariosRecientesPorIpHash(
  ipHash,
  minIntervalMinutes
) {
  const result = await pool.query(
    `
      SELECT
        COUNT(*) FILTER (
          WHERE creado_en >= NOW() - ($2 * INTERVAL '1 minute')
        )::int AS ultimos_intervalo,
        COUNT(*) FILTER (
          WHERE creado_en >= NOW() - INTERVAL '24 hours'
        )::int AS ultimas_24_horas
      FROM comentarios_pagina
      WHERE ip_hash = $1
    `,
    [ipHash, minIntervalMinutes]
  );

  return {
    ultimosIntervalo: result.rows[0].ultimos_intervalo,
    ultimas24Horas: result.rows[0].ultimas_24_horas,
  };
}

export async function actualizarComentarioPagina(id, data) {
  const columns = comentarioColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerComentarioPaginaPorId(id);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(id);

  const result = await pool.query(
    `
      UPDATE comentarios_pagina
      SET ${setSQL}
      WHERE id = $${values.length}
      RETURNING id
    `,
    values
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerComentarioPaginaPorId(id);
}

export async function eliminarComentarioPagina(id) {
  const result = await pool.query(
    `
      DELETE FROM comentarios_pagina
      WHERE id = $1
      RETURNING ${comentarioSelectFields}
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function vaciarComentariosPagina() {
  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS total FROM comentarios_pagina"
  );

  await pool.query("TRUNCATE TABLE comentarios_pagina RESTART IDENTITY");

  return {
    eliminados: countResult.rows[0].total,
  };
}
