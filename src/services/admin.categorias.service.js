import { getPagination } from "../utils/pagination.js";
import {
  activarCategoriaAdmin,
  actualizarCategoriaAdmin,
  actualizarLimiteCategoriasDestacadasConfig,
  crearCategoriaAdmin,
  desactivarCategoriaAdmin,
  listarCategoriasAdminFiltradas,
  obtenerLimiteCategoriasDestacadasConfig,
  obtenerCategoriaAdminPorId,
} from "../models/categorias.model.js";

const allowedCategoryFields = [
  "nombre",
  "slug",
  "descripcion",
  "imagen_url",
  "color_hex",
  "color_texto_hex",
  "destacada",
  "orden_destacado",
  "activa",
];
const MIN_DESTACADAS_LIMIT = 1;
const MAX_DESTACADAS_LIMIT = 50;

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

function parseBooleanQuery(value) {
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === "true") return true;
  if (normalizedValue === "false") return false;

  return null;
}

function parseCategoriaId(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError("id de categoria invalido");
  }

  return numericId;
}

function parseDestacadasLimit(value) {
  const limit = Number.parseInt(value, 10);

  if (!Number.isInteger(limit)) {
    throw createHttpError("limit debe ser un numero entero");
  }

  if (limit < MIN_DESTACADAS_LIMIT || limit > MAX_DESTACADAS_LIMIT) {
    throw createHttpError(
      `limit debe estar entre ${MIN_DESTACADAS_LIMIT} y ${MAX_DESTACADAS_LIMIT}`
    );
  }

  return limit;
}

function getAdminCategoryFilters(query) {
  const search =
    typeof query.search === "string" && query.search.trim()
      ? query.search.trim()
      : null;

  return {
    search,
    activa: parseBooleanQuery(query.activa),
    destacada: parseBooleanQuery(query.destacada),
  };
}

function pickCategoryData(data, { partial = false } = {}) {
  const categoryData = {};

  for (const field of allowedCategoryFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      categoryData[field] = data[field];
    }
  }

  if (!partial) {
    categoryData.nombre = toTrimmedRequiredString(categoryData.nombre, "nombre");
    categoryData.slug = toTrimmedRequiredString(categoryData.slug, "slug");
  }

  if (categoryData.nombre !== undefined) {
    categoryData.nombre = toTrimmedRequiredString(categoryData.nombre, "nombre");
  }

  if (categoryData.slug !== undefined) {
    categoryData.slug = toTrimmedRequiredString(categoryData.slug, "slug");
  }

  for (const field of [
    "descripcion",
    "imagen_url",
    "color_hex",
    "color_texto_hex",
  ]) {
    if (categoryData[field] !== undefined) {
      categoryData[field] = toOptionalString(categoryData[field]);
    }
  }

  if (categoryData.orden_destacado !== undefined) {
    categoryData.orden_destacado = toOptionalNumber(
      categoryData.orden_destacado,
      "orden_destacado"
    );
  }

  for (const field of ["destacada", "activa"]) {
    if (categoryData[field] !== undefined) {
      categoryData[field] = toOptionalBoolean(categoryData[field], field);
    }
  }

  for (const [field, value] of Object.entries(categoryData)) {
    if (value === undefined) {
      delete categoryData[field];
    }
  }

  return categoryData;
}

export async function obtenerCategoriasAdmin(query) {
  const filters = getAdminCategoryFilters(query);
  const pagination = getPagination(query);

  const { categorias, total } = await listarCategoriasAdminFiltradas(
    filters,
    pagination
  );
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data: categorias,
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

export async function obtenerConfiguracionCategoriasDestacadas() {
  const limit = await obtenerLimiteCategoriasDestacadasConfig();
  return { limit };
}

export async function actualizarConfiguracionCategoriasDestacadas(data) {
  const limit = parseDestacadasLimit(data.limit ?? data.cantidad);
  const configuracion = await actualizarLimiteCategoriasDestacadasConfig(limit);

  if (!configuracion) {
    throw createHttpError("Configuracion de tienda no encontrada", 404);
  }

  return configuracion;
}

export async function obtenerCategoriaAdmin(id) {
  const categoriaId = parseCategoriaId(id);
  const categoria = await obtenerCategoriaAdminPorId(categoriaId);

  if (!categoria) {
    throw createHttpError("Categoria no encontrada", 404);
  }

  return categoria;
}

export async function crearCategoria(data) {
  const categoryData = pickCategoryData(data);
  return crearCategoriaAdmin(categoryData);
}

export async function actualizarCategoria(id, data) {
  const categoriaId = parseCategoriaId(id);
  const currentCategory = await obtenerCategoriaAdminPorId(categoriaId);

  if (!currentCategory) {
    throw createHttpError("Categoria no encontrada", 404);
  }

  const categoryData = pickCategoryData(data, { partial: true });
  const updatedCategory = await actualizarCategoriaAdmin(categoriaId, categoryData);

  if (!updatedCategory) {
    throw createHttpError("Categoria no encontrada", 404);
  }

  return updatedCategory;
}

export async function desactivarCategoria(id) {
  const categoriaId = parseCategoriaId(id);
  const categoria = await desactivarCategoriaAdmin(categoriaId);

  if (!categoria) {
    throw createHttpError("Categoria no encontrada", 404);
  }

  return categoria;
}

export async function activarCategoria(id) {
  const categoriaId = parseCategoriaId(id);
  const categoria = await activarCategoriaAdmin(categoriaId);

  if (!categoria) {
    throw createHttpError("Categoria no encontrada", 404);
  }

  return categoria;
}
