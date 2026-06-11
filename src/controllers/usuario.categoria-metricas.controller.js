import { registrarVistaCategoria } from "../services/categoria-metricas.service.js";
import {
  obtenerIpRealMetricas,
  obtenerUserAgentMetricas,
} from "../services/metricas-eventos-control.service.js";
import { successResponse } from "../utils/response.js";

export async function registrarVistaCategoriaController(req, res, next) {
  try {
    const resultado = await registrarVistaCategoria(req.params.categoriaId, {
      ip: obtenerIpRealMetricas(req),
      userAgent: obtenerUserAgentMetricas(req),
    });

    res.json(successResponse(resultado));
  } catch (error) {
    next(error);
  }
}
