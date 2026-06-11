import {
  actualizarMetricaCategoriaAdmin,
  eliminarMetricaCategoriaAdmin,
  obtenerMetricaCategoriaAdmin,
  obtenerMetricasCategoriasAdmin,
  resetearMetricaCategoriaAdmin,
} from "../services/categoria-metricas.service.js";
import { successResponse } from "../utils/response.js";

export async function listarMetricasCategoriasAdminController(
  _req,
  res,
  next
) {
  try {
    const metricas = await obtenerMetricasCategoriasAdmin();
    res.json(successResponse(metricas));
  } catch (error) {
    next(error);
  }
}

export async function obtenerMetricaCategoriaAdminController(req, res, next) {
  try {
    const metrica = await obtenerMetricaCategoriaAdmin(req.params.categoriaId);
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}

export async function actualizarMetricaCategoriaAdminController(
  req,
  res,
  next
) {
  try {
    const metrica = await actualizarMetricaCategoriaAdmin(
      req.params.categoriaId,
      req.body
    );
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}

export async function resetearMetricaCategoriaAdminController(req, res, next) {
  try {
    const metrica = await resetearMetricaCategoriaAdmin(req.params.categoriaId);
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}

export async function eliminarMetricaCategoriaAdminController(req, res, next) {
  try {
    const metrica = await eliminarMetricaCategoriaAdmin(req.params.categoriaId);
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}
