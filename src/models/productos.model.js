import { pool } from "../config/db.js";

// ESTE ARCHIVO LO LLAMA src/services/usuario.productos.service.js.
// AQUI SE HACE LA CONSULTA REAL A POSTGRES CON FILTROS Y PAGINACION.
// EL MODELO RECIBE LOS DATOS YA LIMPIOS Y LOS CONVIERTE EN SQL.

/**
 * LISTAR: OBTIENE LOS PRODUCTOS FILTRADOS Y PAGINADOS PARA EL FRONTEND.
 * RECIBE LOS FILTROS APLICADOS POR EL USUARIO (CATEGORIA, MARCA, PRECIO, ETC).
 * RETORNA UN OBJETO CON LOS PRODUCTOS Y EL TOTAL PARA CALCULAR PAGINAS.
 */
export async function listarProductosFiltrados(filters, pagination) {
  // ARRAY DE PARAMETROS: EVITA CONCATENAR SQL Y AYUDA A PREVENIR INJECTION.
  const values = [];
  // PUBLICO: SOLO PRODUCTOS ACTIVOS DE CATEGORIAS ACTIVAS.
  const where = [
    "p.activo = true",
    `EXISTS (
      SELECT 1
      FROM categorias categoria_publica
      WHERE categoria_publica.id = p.categoria_id
        AND categoria_publica.activa = true
    )`,
  ];

  // SI VIENE categoria_id, SE AGREGA AL WHERE.
  if (filters.categoria_id) {
    values.push(filters.categoria_id);
    where.push(`p.categoria_id = $${values.length}`);
  }

  // SI VIENE marca, SE COMPARA SIN DISTINCTION DE MAYUSCULAS.
  if (filters.marca) {
    values.push(filters.marca);
    where.push(`LOWER(p.marca) = LOWER($${values.length})`);
  }

  // SI VIENE modelo, TAMBIEN SE FILTRA.
  if (filters.modelo) {
    values.push(filters.modelo);
    where.push(`LOWER(p.modelo) = LOWER($${values.length})`);
  }

  // SI VIENE tipo_producto, SE APLICA EL FILTRO.
  if (filters.tipo_producto) {
    values.push(filters.tipo_producto);
    where.push(`LOWER(p.tipo_producto) = LOWER($${values.length})`);
  }

  // SI VIENE condicion, SE AGREGA AL WHERE.
  if (filters.condicion) {
    values.push(filters.condicion);
    where.push(`p.condicion = $${values.length}`);
  }

  // PRECIO MINIMO.
  if (filters.precio_min !== null) {
    values.push(filters.precio_min);
    where.push(`p.precio >= $${values.length}`);
  }

  // PRECIO MAXIMO.
  if (filters.precio_max !== null) {
    values.push(filters.precio_max);
    where.push(`p.precio <= $${values.length}`);
  }

  // STOCK EXACTO.
  if (filters.stock !== null) {
    values.push(filters.stock);
    where.push(`p.stock = $${values.length}`);
  }

  // AÑO EXACTO.
  if (filters.anio) {
    values.push(filters.anio);
    where.push(`p.anio = $${values.length}`);
  }

  // AÑO MINIMO.
  if (filters.anio_min !== null) {
    values.push(filters.anio_min);
    where.push(`p.anio >= $${values.length}`);
  }

  // AÑO MAXIMO.
  if (filters.anio_max !== null) {
    values.push(filters.anio_max);
    where.push(`p.anio <= $${values.length}`);
  }

  // DESTACADO = TRUE O FALSE.
  if (filters.destacado !== null) {
    values.push(filters.destacado);
    where.push(`p.destacado = $${values.length}`);
  }

  // DISPONIBILIDAD ESPECIAL: DISPONIBLE O PROXIMAMENTE.
  if (filters.disponibilidad) {
    if (filters.disponibilidad === "disponible") {
      where.push("p.stock > 0");
    }

    if (filters.disponibilidad === "proximamente") {
      where.push("p.stock = 0 AND p.proximamente = true");
    }
  }

  // BUSQUEDA GENERAL: USA ILIKE EN VARIOS CAMPOS.
  if (filters.search) {
    values.push(`%${filters.search}%`);
    where.push(`
      (
        p.nombre ILIKE $${values.length}
        OR p.marca ILIKE $${values.length}
        OR p.modelo ILIKE $${values.length}
        OR p.tipo_producto ILIKE $${values.length}
        OR p.codigo_producto ILIKE $${values.length}
      )
    `);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // COUNT TOTAL: EL FRONTEND LO USA PARA SABER CUANTAS PAGINAS EXISTEN.
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM productos p
    ${whereSQL}
  `;

  const totalResult = await pool.query(countQuery, values);
  const total = totalResult.rows[0].total;

  // LIMIT Y OFFSET: MUESTRAN SOLO LA PAGINA SOLICITADA.
  values.push(pagination.limit);
  const limitIndex = values.length;

  values.push(pagination.offset);
  const offsetIndex = values.length;

  // CONSULTA FINAL: TRAE LOS CAMPOS QUE USA EL FRONTEND EN LA LISTA.
  const dataQuery = `
    SELECT 
      p.id,
      p.nombre,
      p.slug,
      p.descripcion,
      p.tipo_producto,
      p.marca,
      p.modelo,
      p.anio,
      p.codigo_producto,
      p.condicion,
      p.precio,
      p.stock,
      p.proximamente,
      p.destacado,
      p.categoria_id,
      c.nombre AS categoria_nombre,
      c.color_hex,
      c.color_texto_hex,
      (
        SELECT pi.imagen_url
        FROM producto_imagenes pi
        WHERE pi.producto_id = p.id
        ORDER BY pi.principal DESC, pi.orden ASC
        LIMIT 1
      ) AS imagen_principal,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'imagen_url', pi.imagen_url,
              'principal', pi.principal,
              'orden', pi.orden
            )
            ORDER BY pi.principal DESC, pi.orden ASC, pi.id ASC
          )
          FROM producto_imagenes pi
          WHERE pi.producto_id = p.id
        ),
        '[]'::json
      ) AS imagenes,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', pe.id,
              'nombre', pe.nombre,
              'valor', pe.valor
            )
            ORDER BY pe.id ASC
          )
          FROM producto_especificaciones pe
          WHERE pe.producto_id = p.id
        ),
        '[]'::json
      ) AS especificaciones
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    ${whereSQL}
    ORDER BY p.destacado DESC, p.creado_en DESC
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const productosResult = await pool.query(dataQuery, values);

  return {
    productos: productosResult.rows,
    total,
  };
}

/**
 * OBTENER PRODUCTO PUBLICO: TRAE UN PRODUCTO ACTIVO POR SLUG.
 * SE USA EN LA PAGINA /productos/[slug] DEL FRONTEND.
 */
export async function obtenerProductoPublicoPorSlug(slug) {
  const result = await pool.query(
    `
      SELECT
        p.id,
        p.nombre,
        p.slug,
        p.descripcion,
        p.tipo_producto,
        p.marca,
        p.modelo,
        p.anio,
        p.codigo_producto,
        p.condicion,
        p.precio,
        p.stock,
        p.proximamente,
        p.destacado,
        p.categoria_id,
        c.nombre AS categoria_nombre,
        c.color_hex,
        c.color_texto_hex,
        (
          SELECT pi.imagen_url
          FROM producto_imagenes pi
          WHERE pi.producto_id = p.id
          ORDER BY pi.principal DESC, pi.orden ASC
          LIMIT 1
        ) AS imagen_principal,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'imagen_url', pi.imagen_url,
                'principal', pi.principal,
                'orden', pi.orden
              )
              ORDER BY pi.principal DESC, pi.orden ASC, pi.id ASC
            )
            FROM producto_imagenes pi
            WHERE pi.producto_id = p.id
          ),
          '[]'::json
        ) AS imagenes,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pe.id,
                'nombre', pe.nombre,
                'valor', pe.valor
              )
              ORDER BY pe.id ASC
            )
            FROM producto_especificaciones pe
            WHERE pe.producto_id = p.id
          ),
          '[]'::json
        ) AS especificaciones
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE LOWER(p.slug) = LOWER($1)
        AND p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias categoria_publica
          WHERE categoria_publica.id = p.categoria_id
            AND categoria_publica.activa = true
        )
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] || null;
}

/**
 * OBTENER OPCIONES FILTROS: TRAE LOS VALORES UNICOS DISPONIBLES PARA CADA FILTRO.
 * SE USA PARA LLENAR LOS DROPDOWNS Y SELECTORES DEL FRONTEND CON DATOS REALES.
 * INCLUYE CATEGORIAS, MARCAS, MODELOS, TIPOS, CONDICIONES, AÑOS Y PRECIOS MIN/MAX.
 */
export async function obtenerOpcionesFiltrosProductos() {
  const [
    categoriasResult,
    marcasResult,
    modelosResult,
    tiposProductoResult,
    condicionesResult,
    aniosResult,
    preciosResult,
    disponibilidadResult,
  ] = await Promise.all([
    pool.query(`
      SELECT DISTINCT c.id, c.nombre, c.slug
      FROM categorias c
      INNER JOIN productos p ON p.categoria_id = c.id
      WHERE c.activa = true
        AND p.activo = true
      ORDER BY c.nombre ASC
    `),
    pool.query(`
      SELECT DISTINCT p.marca AS value
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
        AND p.marca IS NOT NULL
        AND BTRIM(p.marca) <> ''
      ORDER BY p.marca ASC
    `),
    pool.query(`
      SELECT DISTINCT p.modelo AS value
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
        AND p.modelo IS NOT NULL
        AND BTRIM(p.modelo) <> ''
      ORDER BY p.modelo ASC
    `),
    pool.query(`
      SELECT DISTINCT p.tipo_producto AS value
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
        AND p.tipo_producto IS NOT NULL
        AND BTRIM(p.tipo_producto) <> ''
      ORDER BY p.tipo_producto ASC
    `),
    pool.query(`
      SELECT DISTINCT p.condicion AS value
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
        AND p.condicion IS NOT NULL
        AND BTRIM(p.condicion) <> ''
      ORDER BY p.condicion ASC
    `),
    pool.query(`
      SELECT DISTINCT p.anio AS value
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
        AND p.anio IS NOT NULL
      ORDER BY p.anio DESC
    `),
    pool.query(`
      SELECT
        MIN(p.precio)::numeric AS precio_min,
        MAX(p.precio)::numeric AS precio_max
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
    `),
    pool.query(`
      SELECT
        BOOL_OR(p.stock > 0) AS tiene_disponibles,
        BOOL_OR(p.stock = 0 AND p.proximamente = true) AS tiene_proximamente
      FROM productos p
      WHERE p.activo = true
        AND EXISTS (
          SELECT 1
          FROM categorias c
          WHERE c.id = p.categoria_id
            AND c.activa = true
        )
    `),
  ]);

  const opcionesDisponibilidad = [];
  const disponibilidad = disponibilidadResult.rows[0];

  if (disponibilidad.tiene_disponibles) {
    opcionesDisponibilidad.push("disponible");
  }

  if (disponibilidad.tiene_proximamente) {
    opcionesDisponibilidad.push("proximamente");
  }

  return {
    categorias: categoriasResult.rows,
    marcas: marcasResult.rows.map((row) => row.value),
    modelos: modelosResult.rows.map((row) => row.value),
    tipos_producto: tiposProductoResult.rows.map((row) => row.value),
    condiciones: condicionesResult.rows.map((row) => row.value),
    anios: aniosResult.rows.map((row) => row.value),
    precios: {
      precio_min: preciosResult.rows[0].precio_min,
      precio_max: preciosResult.rows[0].precio_max,
    },
    disponibilidad: opcionesDisponibilidad,
  };
}

export async function obtenerOpcionesFiltrosProductosAdmin() {
  const [
    categoriasResult,
    marcasResult,
    modelosResult,
    tiposProductoResult,
    condicionesResult,
    aniosResult,
    preciosResult,
    disponibilidadResult,
    activosResult,
    destacadosResult,
  ] = await Promise.all([
    pool.query(`
      SELECT DISTINCT c.id, c.nombre, c.slug, c.activa
      FROM categorias c
      ORDER BY c.nombre ASC
    `),
    pool.query(`
      SELECT DISTINCT p.marca AS value
      FROM productos p
      WHERE p.marca IS NOT NULL
        AND BTRIM(p.marca) <> ''
      ORDER BY p.marca ASC
    `),
    pool.query(`
      SELECT DISTINCT p.modelo AS value
      FROM productos p
      WHERE p.modelo IS NOT NULL
        AND BTRIM(p.modelo) <> ''
      ORDER BY p.modelo ASC
    `),
    pool.query(`
      SELECT DISTINCT p.tipo_producto AS value
      FROM productos p
      WHERE p.tipo_producto IS NOT NULL
        AND BTRIM(p.tipo_producto) <> ''
      ORDER BY p.tipo_producto ASC
    `),
    pool.query(`
      SELECT DISTINCT p.condicion AS value
      FROM productos p
      WHERE p.condicion IS NOT NULL
        AND BTRIM(p.condicion) <> ''
      ORDER BY p.condicion ASC
    `),
    pool.query(`
      SELECT DISTINCT p.anio AS value
      FROM productos p
      WHERE p.anio IS NOT NULL
      ORDER BY p.anio DESC
    `),
    pool.query(`
      SELECT
        MIN(p.precio)::numeric AS precio_min,
        MAX(p.precio)::numeric AS precio_max
      FROM productos p
    `),
    pool.query(`
      SELECT
        BOOL_OR(p.stock > 0) AS tiene_disponibles,
        BOOL_OR(p.stock = 0 AND p.proximamente = true) AS tiene_proximamente
      FROM productos p
    `),
    pool.query(`
      SELECT DISTINCT p.activo AS value
      FROM productos p
      ORDER BY p.activo DESC
    `),
    pool.query(`
      SELECT DISTINCT p.destacado AS value
      FROM productos p
      ORDER BY p.destacado DESC
    `),
  ]);

  const opcionesDisponibilidad = [];
  const disponibilidad = disponibilidadResult.rows[0];

  if (disponibilidad.tiene_disponibles) {
    opcionesDisponibilidad.push("disponible");
  }

  if (disponibilidad.tiene_proximamente) {
    opcionesDisponibilidad.push("proximamente");
  }

  return {
    categorias: categoriasResult.rows,
    marcas: marcasResult.rows.map((row) => row.value),
    modelos: modelosResult.rows.map((row) => row.value),
    tipos_producto: tiposProductoResult.rows.map((row) => row.value),
    condiciones: condicionesResult.rows.map((row) => row.value),
    anios: aniosResult.rows.map((row) => row.value),
    precios: {
      precio_min: preciosResult.rows[0].precio_min,
      precio_max: preciosResult.rows[0].precio_max,
    },
    disponibilidad: opcionesDisponibilidad,
    activos: activosResult.rows.map((row) => row.value),
    destacados: destacadosResult.rows.map((row) => row.value),
  };
}

const adminSelectFields = `
  p.id,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  c.color_hex,
  c.color_texto_hex,
  p.nombre,
  p.slug,
  p.descripcion,
  p.tipo_producto,
  p.marca,
  p.modelo,
  p.anio,
  p.codigo_producto,
  p.condicion,
  p.precio,
  p.stock,
  p.proximamente,
  p.destacado,
  p.orden_destacado,
  COALESCE(pm.vistas, 0) AS vistas,
  p.activo,
  p.creado_en,
  p.actualizado_en,
  (
    SELECT pi.imagen_url
    FROM producto_imagenes pi
    WHERE pi.producto_id = p.id
    ORDER BY pi.principal DESC, pi.orden ASC
    LIMIT 1
  ) AS imagen_principal,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', pi.id,
          'producto_id', pi.producto_id,
          'imagen_url', pi.imagen_url,
          'principal', pi.principal,
          'orden', pi.orden
        )
        ORDER BY pi.principal DESC, pi.orden ASC, pi.id ASC
      )
      FROM producto_imagenes pi
      WHERE pi.producto_id = p.id
    ),
    '[]'::json
  ) AS imagenes,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', pe.id,
          'producto_id', pe.producto_id,
          'nombre', pe.nombre,
          'valor', pe.valor
        )
        ORDER BY pe.id ASC
      )
      FROM producto_especificaciones pe
      WHERE pe.producto_id = p.id
    ),
    '[]'::json
  ) AS especificaciones
`;

const adminSortColumns = {
  creado_en: "p.creado_en",
  actualizado_en: "p.actualizado_en",
  nombre: "p.nombre",
  precio: "p.precio",
  stock: "p.stock",
  vistas: "COALESCE(pm.vistas, 0)",
};

function obtenerOrdenProductosAdmin(sort) {
  const sortBy = adminSortColumns[sort?.sortBy] || adminSortColumns.creado_en;
  const sortOrder = sort?.sortOrder === "ASC" ? "ASC" : "DESC";

  return `ORDER BY ${sortBy} ${sortOrder}, p.id DESC`;
}

function agregarFiltrosAdmin(filters, values, where) {
  if (filters.activo !== null) {
    values.push(filters.activo);
    where.push(`p.activo = $${values.length}`);
  }

  if (filters.categoria_id) {
    values.push(filters.categoria_id);
    where.push(`p.categoria_id = $${values.length}`);
  }

  if (filters.marca) {
    values.push(filters.marca);
    where.push(`LOWER(p.marca) = LOWER($${values.length})`);
  }

  if (filters.modelo) {
    values.push(filters.modelo);
    where.push(`LOWER(p.modelo) = LOWER($${values.length})`);
  }

  if (filters.tipo_producto) {
    values.push(filters.tipo_producto);
    where.push(`LOWER(p.tipo_producto) = LOWER($${values.length})`);
  }

  if (filters.condicion) {
    values.push(filters.condicion);
    where.push(`p.condicion = $${values.length}`);
  }

  if (filters.precio_min !== null) {
    values.push(filters.precio_min);
    where.push(`p.precio >= $${values.length}`);
  }

  if (filters.precio_max !== null) {
    values.push(filters.precio_max);
    where.push(`p.precio <= $${values.length}`);
  }

  if (filters.stock !== null) {
    values.push(filters.stock);
    where.push(`p.stock = $${values.length}`);
  }

  if (filters.anio) {
    values.push(filters.anio);
    where.push(`p.anio = $${values.length}`);
  }

  if (filters.anio_min !== null) {
    values.push(filters.anio_min);
    where.push(`p.anio >= $${values.length}`);
  }

  if (filters.anio_max !== null) {
    values.push(filters.anio_max);
    where.push(`p.anio <= $${values.length}`);
  }

  if (filters.destacado !== null) {
    values.push(filters.destacado);
    where.push(`p.destacado = $${values.length}`);
  }

  if (filters.disponibilidad) {
    if (filters.disponibilidad === "disponible") {
      where.push("p.stock > 0");
    }

    if (filters.disponibilidad === "proximamente") {
      where.push("p.stock = 0 AND p.proximamente = true");
    }
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    where.push(`
      (
        p.nombre ILIKE $${values.length}
        OR p.marca ILIKE $${values.length}
        OR p.modelo ILIKE $${values.length}
        OR p.tipo_producto ILIKE $${values.length}
        OR p.codigo_producto ILIKE $${values.length}
      )
    `);
  }
}

/**
 * LISTAR ADMIN: OBTIENE LA LISTA DE PRODUCTOS PARA EL PANEL DE ADMINISTRACIÓN.
 * UTILIZA LOS MISMOS FILTROS QUE EL FRONTEND PERO INCLUYE CAMPOS ADICIONALES.
 * RETORNA PRODUCTOS CON INFORMACION COMPLETA INCLUYENDO ESTADO Y ORDEN.
 */
export async function listarProductosAdminFiltrados(filters, pagination, sort) {
  const values = [];
  const where = [];

  agregarFiltrosAdmin(filters, values, where);

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM productos p
    ${whereSQL}
  `;

  const totalResult = await pool.query(countQuery, values);
  const total = totalResult.rows[0].total;

  values.push(pagination.limit);
  const limitIndex = values.length;

  values.push(pagination.offset);
  const offsetIndex = values.length;

  const orderSQL = obtenerOrdenProductosAdmin(sort);
  const dataQuery = `
    SELECT
      ${adminSelectFields}
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN producto_metricas pm ON pm.producto_id = p.id
    ${whereSQL}
    ${orderSQL}
    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const productosResult = await pool.query(dataQuery, values);

  return {
    productos: productosResult.rows,
    total,
  };
}

export async function obtenerResumenProductosAdmin() {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE activo = true)::int AS activos,
      COUNT(*) FILTER (WHERE activo = false)::int AS inactivos,
      COUNT(*) FILTER (WHERE stock > 0 AND stock <= 5)::int AS stock_bajo,
      COUNT(*) FILTER (WHERE stock = 0)::int AS sin_stock,
      COUNT(*) FILTER (WHERE destacado = true)::int AS destacados,
      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM producto_imagenes pi
          WHERE pi.producto_id = productos.id
        )
      )::int AS sin_imagen
    FROM productos
  `);

  return result.rows[0];
}

/**
 * OBTENER PRODUCTO ADMIN: TRAE UN PRODUCTO ESPECIFICO CON TODOS SUS DATOS.
 * SE USA DESDE EL ADMIN PARA MOSTRAR O EDITAR UN PRODUCTO INDIVIDUAL.
 * RETORNA TODA LA INFORMACION DEL PRODUCTO O NULL SI NO EXISTE.
 */
export async function obtenerProductoAdminPorId(id) {
  const result = await pool.query(
    `
      SELECT
        ${adminSelectFields}
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN producto_metricas pm ON pm.producto_id = p.id
      WHERE p.id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function categoriaProductoExiste(categoriaId) {
  const result = await pool.query(
    "SELECT 1 FROM categorias WHERE id = $1 LIMIT 1",
    [categoriaId]
  );

  return result.rowCount > 0;
}

const adminProductColumns = [
  "categoria_id",
  "nombre",
  "slug",
  "descripcion",
  "tipo_producto",
  "marca",
  "modelo",
  "anio",
  "codigo_producto",
  "condicion",
  "precio",
  "stock",
  "proximamente",
  "destacado",
  "orden_destacado",
  "activo",
  "creado_en",
];

/**
 * CREAR: INSERTA UN NUEVO PRODUCTO EN LA BASE DE DATOS.
 * RECIBE LOS DATOS DEL PRODUCTO Y LOS GUARDA DIRECTAMENTE.
 * RETORNA EL PRODUCTO CREADO CON TODOS SUS DATOS INCLUYENDO EL ID ASIGNADO.
 */
export async function crearProductoAdmin(data) {
  const columns = adminProductColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );
  const values = columns.map((column) => data[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);

  const result = await pool.query(
    `
      INSERT INTO productos (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING id
    `,
    values
  );

  return obtenerProductoAdminPorId(result.rows[0].id);
}

/**
 * EDITAR: ACTUALIZA UN PRODUCTO EXISTENTE CON LOS NUEVOS DATOS.
 * SOLO ACTUALIZA LOS CAMPOS QUE VIENEN EN EL OBJETO DATA.
 * RETORNA EL PRODUCTO ACTUALIZADO CON TODOS SUS DATOS ACTUALES.
 */
export async function actualizarProductoAdmin(id, data) {
  const columns = adminProductColumns.filter((column) =>
    Object.prototype.hasOwnProperty.call(data, column)
  );

  if (!columns.length) {
    return obtenerProductoAdminPorId(id);
  }

  const values = columns.map((column) => data[column]);
  const setSQL = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  values.push(id);

  const result = await pool.query(
    `
      UPDATE productos
      SET ${setSQL},
          actualizado_en = NOW()
      WHERE id = $${values.length}
      RETURNING id
    `,
    values
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerProductoAdminPorId(id);
}

/**
 * DESACTIVAR: MARCA UN PRODUCTO COMO INACTIVO SIN ELIMINARLO DE LA BD.
 * ESTO LO OCULTA DEL FRONTEND Y DEL ADMIN PERO CONSERVA EL REGISTRO.
 * RETORNA EL PRODUCTO DESACTIVADO O NULL SI NO EXISTE.
 */
export async function desactivarProductoAdmin(id) {
  const result = await pool.query(
    "UPDATE productos SET activo = false, actualizado_en = NOW() WHERE id = $1 RETURNING id",
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerProductoAdminPorId(id);
}

/**
 * ACTIVAR: MARCA UN PRODUCTO COMO ACTIVO PARA QUE SEA VISIBLE.
 * ESTO HACE QUE APAREZCA EN EL FRONTEND Y ESTE DISPONIBLE PARA COMPRA.
 * RETORNA EL PRODUCTO ACTIVADO O NULL SI NO EXISTE.
 */
export async function activarProductoAdmin(id) {
  const result = await pool.query(
    "UPDATE productos SET activo = true, actualizado_en = NOW() WHERE id = $1 RETURNING id",
    [id]
  );

  if (!result.rowCount) {
    return null;
  }

  return obtenerProductoAdminPorId(id);
}

/**
 * ELIMINAR: BORRA DEFINITIVAMENTE UN PRODUCTO Y SUS DATOS RELACIONADOS.
 * LAS TABLAS CON FK TIENEN ON DELETE CASCADE, PERO SE LIMPIAN EXPLICITAMENTE
 * PARA CUBRIR BASES EXISTENTES QUE NO TENGAN LA REGLA ACTUALIZADA.
 */
export async function eliminarProductoAdmin(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productoResult = await client.query(
      `
        SELECT
          ${adminSelectFields}
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN producto_metricas pm ON pm.producto_id = p.id
        WHERE p.id = $1
        LIMIT 1
      `,
      [id]
    );

    const producto = productoResult.rows[0] || null;
    if (!producto) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      "DELETE FROM metricas_eventos_control WHERE tipo = $1 AND referencia_id = $2",
      ["producto", id]
    );
    await client.query("DELETE FROM producto_metricas WHERE producto_id = $1", [id]);
    await client.query("DELETE FROM producto_especificaciones WHERE producto_id = $1", [id]);
    await client.query("DELETE FROM producto_imagenes WHERE producto_id = $1", [id]);
    await client.query("DELETE FROM productos WHERE id = $1", [id]);

    await client.query("COMMIT");
    return producto;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
