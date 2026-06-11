import { pool } from "../config/db.js";

const TOP_LIMIT = 10;

export async function obtenerDashboardAdminResumen() {
  const [
    metricasResult,
    vistasResult,
    productosPorCategoriaResult,
    productosMasVistosGraficoResult,
    topCategoriasMasVistasResult,
    topProductosMasVistosResult,
  ] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM productos WHERE activo = true) AS productos_activos,
        (SELECT COUNT(*)::int FROM categorias) AS categorias,
        (SELECT COUNT(*)::int FROM home_config WHERE is_active = true) AS banners,
        (SELECT COUNT(*)::int FROM comentarios_pagina) AS comentarios,
        (SELECT COUNT(*)::int FROM productos WHERE destacado = true) AS destacados
    `),
    pool.query(`
      WITH producto_mas_visto AS (
        SELECT
          p.id,
          p.nombre,
          COALESCE(pm.vistas, 0)::int AS vistas
        FROM productos p
        LEFT JOIN producto_metricas pm ON pm.producto_id = p.id
        ORDER BY COALESCE(pm.vistas, 0) DESC, p.id ASC
        LIMIT 1
      ),
      categoria_mas_vista AS (
        SELECT
          c.id,
          c.nombre,
          COALESCE(cm.vistas, 0)::int AS vistas
        FROM categorias c
        LEFT JOIN categoria_metricas cm ON cm.categoria_id = c.id
        ORDER BY COALESCE(cm.vistas, 0) DESC, c.id ASC
        LIMIT 1
      )
      SELECT
        (SELECT COALESCE(SUM(vistas), 0)::int FROM producto_metricas) AS vistas_productos,
        (SELECT COALESCE(SUM(vistas), 0)::int FROM categoria_metricas) AS vistas_categorias,
        COALESCE(
          (SELECT row_to_json(producto_mas_visto) FROM producto_mas_visto),
          NULL
        ) AS producto_mas_visto,
        COALESCE(
          (SELECT row_to_json(categoria_mas_vista) FROM categoria_mas_vista),
          NULL
        ) AS categoria_mas_vista
    `),
    pool.query(`
      SELECT
        c.id AS categoria_id,
        c.nombre AS categoria_nombre,
        COUNT(p.id)::int AS total_productos
      FROM categorias c
      LEFT JOIN productos p ON p.categoria_id = c.id
      GROUP BY c.id, c.nombre
      ORDER BY total_productos DESC, c.nombre ASC
    `),
    pool.query(
      `
        SELECT
          p.id AS producto_id,
          p.nombre,
          c.nombre AS categoria_nombre,
          COALESCE(pm.vistas, 0)::int AS vistas
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN producto_metricas pm ON pm.producto_id = p.id
        ORDER BY COALESCE(pm.vistas, 0) DESC, p.id ASC
        LIMIT $1
      `,
      [TOP_LIMIT]
    ),
    pool.query(
      `
        SELECT
          c.id AS categoria_id,
          c.nombre,
          c.slug,
          COALESCE(cm.vistas, 0)::int AS vistas
        FROM categorias c
        LEFT JOIN categoria_metricas cm ON cm.categoria_id = c.id
        ORDER BY COALESCE(cm.vistas, 0) DESC, c.id ASC
        LIMIT $1
      `,
      [TOP_LIMIT]
    ),
    pool.query(
      `
        SELECT
          p.id AS producto_id,
          p.nombre,
          p.slug,
          c.nombre AS categoria_nombre,
          COALESCE(pm.vistas, 0)::int AS vistas,
          p.activo,
          p.destacado
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN producto_metricas pm ON pm.producto_id = p.id
        ORDER BY COALESCE(pm.vistas, 0) DESC, p.id ASC
        LIMIT $1
      `,
      [TOP_LIMIT]
    ),
  ]);

  return {
    metricas: metricasResult.rows[0],
    vistas: vistasResult.rows[0],
    graficos: {
      productos_por_categoria: productosPorCategoriaResult.rows,
      productos_mas_vistos: productosMasVistosGraficoResult.rows,
    },
    tablas: {
      top_categorias_mas_vistas: topCategoriasMasVistasResult.rows,
      top_productos_mas_vistos: topProductosMasVistosResult.rows,
    },
  };
}
