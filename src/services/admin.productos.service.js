import { getAdminProductFilters } from "../utils/filters.js";
import { getPagination } from "../utils/pagination.js";
import {
  activarProductoAdmin,
  actualizarProductoAdmin,
  categoriaProductoExiste,
  crearProductoAdmin,
  desactivarProductoAdmin,
  eliminarProductoAdmin,
  listarProductosAdminFiltrados,
  obtenerOpcionesFiltrosProductosAdmin,
  obtenerProductoAdminPorId,
  obtenerResumenProductosAdmin,
} from "../models/productos.model.js";

const allowedProductFields = [
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

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toTrimmedRequiredString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw createHttpError(`${fieldName} es obligatorio`);
  }

  return value.trim();
}

function toOptionalString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return value;

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function toOptionalNumber(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    throw createHttpError(`${fieldName} debe ser numerico`);
  }

  return numericValue;
}

function toOptionalBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }

  throw createHttpError(`${fieldName} debe ser true o false`);
}

function toOptionalDate(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    throw createHttpError(`${fieldName} debe ser una fecha valida`);
  }

  return dateValue;
}

function pickProductData(data, { partial = false } = {}) {
  const productData = {};

  for (const field of allowedProductFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      productData[field] = data[field];
    }
  }

  if (!partial) {
    productData.nombre = toTrimmedRequiredString(productData.nombre, "nombre");
    productData.slug = toTrimmedRequiredString(productData.slug, "slug");

    if (productData.precio === undefined || productData.precio === null || productData.precio === "") {
      throw createHttpError("precio es obligatorio");
    }
  }

  if (productData.nombre !== undefined) {
    productData.nombre = toTrimmedRequiredString(productData.nombre, "nombre");
  }

  if (productData.slug !== undefined) {
    productData.slug = toTrimmedRequiredString(productData.slug, "slug");
  }

  for (const field of [
    "descripcion",
    "tipo_producto",
    "marca",
    "modelo",
    "codigo_producto",
    "condicion",
  ]) {
    if (productData[field] !== undefined) {
      productData[field] = toOptionalString(productData[field]);
    }
  }

  for (const field of [
    "categoria_id",
    "anio",
    "precio",
    "stock",
    "orden_destacado",
  ]) {
    if (productData[field] !== undefined) {
      productData[field] = toOptionalNumber(productData[field], field);
    }
  }

  for (const field of ["proximamente", "destacado", "activo"]) {
    if (productData[field] !== undefined) {
      productData[field] = toOptionalBoolean(productData[field], field);
    }
  }

  if (productData.creado_en !== undefined) {
    productData.creado_en = toOptionalDate(productData.creado_en, "creado_en");
  }

  if (productData.precio !== undefined && productData.precio !== null && productData.precio < 0) {
    throw createHttpError("precio debe ser mayor o igual a 0");
  }

  if (productData.stock !== undefined && productData.stock !== null && productData.stock < 0) {
    throw createHttpError("stock debe ser mayor o igual a 0");
  }

  for (const [field, value] of Object.entries(productData)) {
    if (value === undefined) {
      delete productData[field];
    }
  }

  return productData;
}

function parseProductId(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError("id de producto invalido");
  }

  return numericId;
}

async function validateCategoriaIfNeeded(productData) {
  if (productData.categoria_id === undefined || productData.categoria_id === null) {
    return;
  }

  if (!Number.isInteger(productData.categoria_id) || productData.categoria_id <= 0) {
    throw createHttpError("categoria_id debe ser un entero positivo");
  }

  const exists = await categoriaProductoExiste(productData.categoria_id);
  if (!exists) {
    throw createHttpError("categoria_id no existe");
  }
}

function getAdminProductSort(query) {
  const allowedSorts = new Set([
    "creado_en",
    "actualizado_en",
    "nombre",
    "precio",
    "stock",
    "vistas",
  ]);

  const sortBy = allowedSorts.has(query.sort) ? query.sort : "creado_en";
  const normalizedOrder =
    typeof query.order === "string" ? query.order.trim().toLowerCase() : "";
  const normalizedPrecioOrden =
    typeof query.precio_orden === "string"
      ? query.precio_orden.trim().toLowerCase()
      : "";

  if (normalizedPrecioOrden === "asc" || normalizedPrecioOrden === "desc") {
    return {
      sortBy: "precio",
      sortOrder: normalizedPrecioOrden.toUpperCase(),
    };
  }

  return {
    sortBy,
    sortOrder: normalizedOrder === "asc" ? "ASC" : "DESC",
  };
}

export async function obtenerProductosAdmin(query) {
  const filters = getAdminProductFilters(query);
  const pagination = getPagination(query);
  const sort = getAdminProductSort(query);

  const { productos, total } = await listarProductosAdminFiltrados(
    filters,
    pagination,
    sort
  );
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data: productos,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };
}

export async function obtenerResumenAdminProductos() {
  return obtenerResumenProductosAdmin();
}

export async function obtenerFiltrosProductosAdmin() {
  return obtenerOpcionesFiltrosProductosAdmin();
}

export async function obtenerProductoAdmin(id) {
  const productId = parseProductId(id);
  const producto = await obtenerProductoAdminPorId(productId);

  if (!producto) {
    throw createHttpError("Producto no encontrado", 404);
  }

  return producto;
}

export async function crearProducto(data) {
  const productData = pickProductData(data);
  await validateCategoriaIfNeeded(productData);

  return crearProductoAdmin(productData);
}

export async function actualizarProducto(id, data) {
  const productId = parseProductId(id);
  const currentProduct = await obtenerProductoAdminPorId(productId);

  if (!currentProduct) {
    throw createHttpError("Producto no encontrado", 404);
  }

  const productData = pickProductData(data, { partial: true });
  await validateCategoriaIfNeeded(productData);

  const updatedProduct = await actualizarProductoAdmin(productId, productData);
  if (!updatedProduct) {
    throw createHttpError("Producto no encontrado", 404);
  }

  return updatedProduct;
}

export async function desactivarProducto(id) {
  const productId = parseProductId(id);
  const producto = await desactivarProductoAdmin(productId);

  if (!producto) {
    throw createHttpError("Producto no encontrado", 404);
  }

  return producto;
}

export async function activarProducto(id) {
  const productId = parseProductId(id);
  const producto = await activarProductoAdmin(productId);

  if (!producto) {
    throw createHttpError("Producto no encontrado", 404);
  }

  return producto;
}

export async function eliminarProducto(id) {
  const productId = parseProductId(id);
  const producto = await eliminarProductoAdmin(productId);

  if (!producto) {
    throw createHttpError("Producto no encontrado", 404);
  }

  return producto;
}
