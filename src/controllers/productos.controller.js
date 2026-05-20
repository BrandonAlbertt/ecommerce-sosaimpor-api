import {
  obtenerFiltrosProductos,
  obtenerProductos,
} from "../services/productos.service.js";
import { successResponse } from "../utils/response.js";

export async function listarProductos(req, res, next) {
  try {
    console.log("[productos] Request recibida:", {
      method: req.method,
      path: req.originalUrl,
      query: req.query,
    });

    const resultado = await obtenerProductos(req.query);

    res.json(successResponse(resultado.data, resultado.pagination));
  } catch (error) {
    next(error);
  }
}

export async function listarFiltrosProductos(_req, res, next) {
  try {
    console.log("[productos] Request de opciones de filtros");

    const filtros = await obtenerFiltrosProductos();

    res.json(successResponse(filtros));
  } catch (error) {
    next(error);
  }
}
