import { getProductFilters } from "../utils/filters.js";
import { getPagination } from "../utils/pagination.js";
import {
  listarProductosFiltrados,
  obtenerOpcionesFiltrosProductos,
} from "../models/productos.model.js";

export async function obtenerProductos(query) {
  const filters = getProductFilters(query);
  const pagination = getPagination(query);

  console.log("[productos] Filtros construidos:", filters);
  console.log("[productos] Paginacion usada:", pagination);

  const { productos, total } = await listarProductosFiltrados(
    filters,
    pagination
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

export async function obtenerFiltrosProductos() {
  return obtenerOpcionesFiltrosProductos();
}
