import { pool } from "../config/db.js";

const configuracionTiendaSelectFields = `
  id,
  banner_primary_message,
  banner_secondary_message,
  banner_tertiary_message,
  banner_subtitle,
  banner_title,
  header_help_label,
  header_location_label,
  header_location_sub_label,
  header_phone_label,
  header_primary_message,
  header_schedule_friday,
  header_schedule_saturday,
  header_shipping_badge,
  header_secondary_message,
  header_whatsapp_label,
  header_whatsapp_sub_label,
  header_whatsapp_url,
  location_display_address,
  location_display_district,
  seller_whatsapp_url,
  featured_categories_limit,
  comment_min_interval_minutes,
  comment_daily_limit,
  is_active
`;

const configuracionTiendaPublicSelectFields = `
  id,
  banner_primary_message,
  banner_secondary_message,
  banner_tertiary_message,
  banner_subtitle,
  banner_title,
  header_help_label,
  header_location_label,
  header_location_sub_label,
  header_phone_label,
  header_primary_message,
  header_schedule_friday,
  header_schedule_saturday,
  header_shipping_badge,
  header_secondary_message,
  header_whatsapp_label,
  header_whatsapp_sub_label,
  header_whatsapp_url,
  location_display_address,
  location_display_district,
  seller_whatsapp_url,
  featured_categories_limit,
  is_active
`;

const configuracionTiendaColumns = [
  "banner_primary_message",
  "banner_secondary_message",
  "banner_tertiary_message",
  "banner_subtitle",
  "banner_title",
  "header_help_label",
  "header_location_label",
  "header_location_sub_label",
  "header_phone_label",
  "header_primary_message",
  "header_schedule_friday",
  "header_schedule_saturday",
  "header_shipping_badge",
  "header_secondary_message",
  "header_whatsapp_label",
  "header_whatsapp_sub_label",
  "header_whatsapp_url",
  "location_display_address",
  "location_display_district",
  "seller_whatsapp_url",
  "featured_categories_limit",
  "comment_min_interval_minutes",
  "comment_daily_limit",
  "is_active",
];

export async function listarConfiguracionesTienda() {
  const result = await pool.query(
    `
      SELECT ${configuracionTiendaSelectFields}
      FROM home_config
      ORDER BY id ASC
    `
  );

  return result.rows;
}

export async function obtenerConfiguracionTiendaPorId(id) {
  const result = await pool.query(
    `
      SELECT ${configuracionTiendaSelectFields}
      FROM home_config
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function obtenerConfiguracionTiendaActiva() {
  const result = await pool.query(
    `
      SELECT ${configuracionTiendaPublicSelectFields}
      FROM home_config
      WHERE is_active = true
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return result.rows[0] || null;
}

export async function obtenerConfiguracionTiendaActivaCompleta() {
  const result = await pool.query(
    `
      SELECT ${configuracionTiendaSelectFields}
      FROM home_config
      WHERE is_active = true
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return result.rows[0] || null;
}

export async function crearConfiguracionTienda(data) {
  const columns = configuracionTiendaColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );
  const values = columns.map((column) => data[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const insertSQL = columns.length
    ? `
      INSERT INTO home_config (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING id
    `
    : `
      INSERT INTO home_config DEFAULT VALUES
      RETURNING id
    `;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (data.is_active === true) {
      await client.query("UPDATE home_config SET is_active = false");
    }

    const result = await client.query(insertSQL, values);
    await client.query("COMMIT");

    return obtenerConfiguracionTiendaPorId(result.rows[0].id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarConfiguracionTienda(id, data) {
  const columns = configuracionTiendaColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerConfiguracionTiendaPorId(id);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (data.is_active === true) {
      await client.query(
        "UPDATE home_config SET is_active = false WHERE id <> $1",
        [id]
      );
    }

    const result = await client.query(
      `
        UPDATE home_config
        SET ${setSQL}
        WHERE id = $${values.length}
        RETURNING id
      `,
      values
    );

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("COMMIT");
    return obtenerConfiguracionTiendaPorId(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function eliminarConfiguracionTienda(id) {
  const result = await pool.query(
    `
      DELETE FROM home_config
      WHERE id = $1
      RETURNING ${configuracionTiendaSelectFields}
    `,
    [id]
  );

  return result.rows[0] || null;
}
