import {
  actualizarConfiguracion,
  crearConfiguracion,
  eliminarConfiguracion,
  obtenerConfiguracionTienda,
  obtenerConfiguracionesTienda,
} from "../services/configuracion.service.js";
import { successResponse } from "../utils/response.js";

export async function listarConfiguracionesAdminController(_req, res, next) {
  try {
    const configuraciones = await obtenerConfiguracionesTienda();
    res.json(successResponse(configuraciones));
  } catch (error) {
    next(error);
  }
}

export async function obtenerConfiguracionAdminPorIdController(req, res, next) {
  try {
    const configuracion = await obtenerConfiguracionTienda(req.params.id);
    res.json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}

export async function crearConfiguracionAdminController(req, res, next) {
  try {
    const configuracion = await crearConfiguracion(req.body);
    res.status(201).json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}

export async function actualizarConfiguracionAdminController(req, res, next) {
  try {
    const configuracion = await actualizarConfiguracion(req.params.id, req.body);
    res.json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}

export async function eliminarConfiguracionAdminController(req, res, next) {
  try {
    const configuracion = await eliminarConfiguracion(req.params.id);
    res.json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}
