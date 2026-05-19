import { obtenerProductos } from "../services/productos.service.js";
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
