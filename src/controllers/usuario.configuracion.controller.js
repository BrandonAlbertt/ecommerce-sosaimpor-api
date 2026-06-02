import {
  obtenerConfiguracionPublicaTienda,
} from "../services/configuracion.service.js";
import { successResponse } from "../utils/response.js";

export async function obtenerConfiguracionPublicaController(_req, res, next) {
  try {
    const configuracion = await obtenerConfiguracionPublicaTienda();
    res.json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}
