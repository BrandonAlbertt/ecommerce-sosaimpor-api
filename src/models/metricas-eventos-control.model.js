import { pool } from "../config/db.js";

export async function eliminarEventosMetricasAntiguos(maxAgeHours = 24) {
  await pool.query(
    `
      DELETE FROM metricas_eventos_control
      WHERE creado_en < NOW() - ($1 * INTERVAL '1 hour')
    `,
    [maxAgeHours]
  );
}

export async function crearEventoMetricaControlSiNoExisteReciente({
  tipo,
  referenciaId,
  ipHash,
  userAgentHash,
  cooldownMinutes,
}) {
  const result = await pool.query(
    `
      INSERT INTO metricas_eventos_control (
        tipo,
        referencia_id,
        ip_hash,
        user_agent_hash
      )
      SELECT $1, $2, $3, $4
      WHERE NOT EXISTS (
        SELECT 1
        FROM metricas_eventos_control
        WHERE tipo = $1
          AND referencia_id = $2
          AND ip_hash = $3
          AND user_agent_hash = $4
          AND creado_en >= NOW() - ($5 * INTERVAL '1 minute')
      )
      RETURNING id, tipo, referencia_id, creado_en
    `,
    [tipo, referenciaId, ipHash, userAgentHash, cooldownMinutes]
  );

  return result.rows[0] || null;
}
