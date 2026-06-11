import { registrarVistaProducto } from "../services/producto-metricas.service.js";
import {
  obtenerIpRealMetricas,
  obtenerUserAgentMetricas,
} from "../services/metricas-eventos-control.service.js";
import { successResponse } from "../utils/response.js";

export async function registrarVistaProductoController(req, res, next) {
  try {
    const resultado = await registrarVistaProducto(req.params.productoId, {
      ip: obtenerIpRealMetricas(req),
      userAgent: obtenerUserAgentMetricas(req),
    });

    res.json(successResponse(resultado));
  } catch (error) {
    next(error);
  }
}
