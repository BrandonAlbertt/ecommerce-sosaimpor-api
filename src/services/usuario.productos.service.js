import { getProductFilters } from "../utils/filters.js";
import { getPagination } from "../utils/pagination.js";
import {
  listarProductosFiltrados,
  obtenerOpcionesFiltrosProductos,
  obtenerProductoPublicoPorSlug,
} from "../models/productos.model.js";

// ESTE ARCHIVO LO LLAMA src/controllers/usuario.productos.controller.js.
// AQUI SE UNE src/utils/filters.js, src/utils/pagination.js Y src/models/productos.model.js.
// EL SERVICE RECIBE LA DATA DEL CONTROLLER Y LA PREPARA PARA EL MODELO.
export async function obtenerProductos(query) {
  // CONVIERTE req.query EN FILTROS LIMPIOS Y PAGINACION LISTA PARA SQL.
  const filters = getProductFilters(query);
  const pagination = getPagination(query);

  // DEBUG: MUESTRA LO QUE SE VA A ENVIAR AL MODELO.
  console.log("[productos] Filtros construidos:", filters);
  console.log("[productos] Paginacion usada:", pagination);

  // listarProductosFiltrados() VIVE EN src/models/productos.model.js.
  // ESA FUNCION HACE EL COUNT TOTAL Y LA CONSULTA FINAL A POSTGRES.
  const { productos, total } = await listarProductosFiltrados(
    filters,
    pagination
  );

  // CALCULA CUANTAS PAGINAS EXISTEN EN TOTAL PARA EL FRONTEND.
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

// Detalle publico por slug para /api/productos/:slug.
export async function obtenerProductoPorSlug(slug) {
  const cleanSlug = typeof slug === "string" ? slug.trim() : "";

  if (!cleanSlug) {
    const error = new Error("Slug de producto requerido.");
    error.statusCode = 400;
    throw error;
  }

  const producto = await obtenerProductoPublicoPorSlug(cleanSlug);

  if (!producto) {
    const error = new Error("Producto no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return producto;
}

// obtenerFiltrosProductos() TAMBIEN LA LLAMA src/controllers/usuario.productos.controller.js.
// ESTA FUNCION USA EL MODELO PARA SACAR OPCIONES UNICAS DE FILTRO.
// EL CONTROLLER LE PIDE ESTA DATA Y EL SERVICE SE LA DEVUELVE LISTA.
export async function obtenerFiltrosProductos() {
  return obtenerOpcionesFiltrosProductos();
}
