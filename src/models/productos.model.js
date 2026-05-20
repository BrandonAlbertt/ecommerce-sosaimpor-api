import { pool } from "../config/db.js";

// ESTE ARCHIVO LO LLAMA src/services/productos.service.js.
// AQUI SE HACE LA CONSULTA REAL A POSTGRES CON FILTROS Y PAGINACION.
// EL MODELO RECIBE LOS DATOS YA LIMPIOS Y LOS CONVIERTE EN SQL.
export async function listarProductosFiltrados(filters, pagination) {
  // ARRAY DE PARAMETROS: EVITA CONCATENAR SQL Y AYUDA A PREVENIR INJECTION.
  const values = [];
  // BASE DE LA CONSULTA: SIEMPRE SOLO PRODUCTOS ACTIVOS.
  const where = ["p.activo = true"];

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
      (
        SELECT pi.imagen_url
        FROM producto_imagenes pi
        WHERE pi.producto_id = p.id
        ORDER BY pi.principal DESC, pi.orden ASC
        LIMIT 1
      ) AS imagen_principal
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

// obtenerOpcionesFiltrosProductos() LA LLAMA src/services/productos.service.js.
// ESTA FUNCION SIRVE PARA LLENAR LOS FILTROS DEL FRONTEND CON VALORES REALES.
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
        AND p.marca IS NOT NULL
        AND BTRIM(p.marca) <> ''
      ORDER BY p.marca ASC
    `),
    pool.query(`
      SELECT DISTINCT p.modelo AS value
      FROM productos p
      WHERE p.activo = true
        AND p.modelo IS NOT NULL
        AND BTRIM(p.modelo) <> ''
      ORDER BY p.modelo ASC
    `),
    pool.query(`
      SELECT DISTINCT p.tipo_producto AS value
      FROM productos p
      WHERE p.activo = true
        AND p.tipo_producto IS NOT NULL
        AND BTRIM(p.tipo_producto) <> ''
      ORDER BY p.tipo_producto ASC
    `),
    pool.query(`
      SELECT DISTINCT p.condicion AS value
      FROM productos p
      WHERE p.activo = true
        AND p.condicion IS NOT NULL
        AND BTRIM(p.condicion) <> ''
      ORDER BY p.condicion ASC
    `),
    pool.query(`
      SELECT DISTINCT p.anio AS value
      FROM productos p
      WHERE p.activo = true
        AND p.anio IS NOT NULL
      ORDER BY p.anio DESC
    `),
    pool.query(`
      SELECT
        MIN(p.precio)::numeric AS precio_min,
        MAX(p.precio)::numeric AS precio_max
      FROM productos p
      WHERE p.activo = true
    `),
    pool.query(`
      SELECT
        BOOL_OR(p.stock > 0) AS tiene_disponibles,
        BOOL_OR(p.stock = 0 AND p.proximamente = true) AS tiene_proximamente
      FROM productos p
      WHERE p.activo = true
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
