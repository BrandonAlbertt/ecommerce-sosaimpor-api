import {
  actualizarMetricaProductoAdmin,
  eliminarMetricaProductoAdmin,
  obtenerMetricaProductoAdmin,
  obtenerMetricasProductosAdmin,
  resetearMetricaProductoAdmin,
} from "../services/producto-metricas.service.js";
import { successResponse } from "../utils/response.js";

export async function listarMetricasProductosAdminController(
  _req,
  res,
  next
) {
  try {
    const metricas = await obtenerMetricasProductosAdmin();
    res.json(successResponse(metricas));
  } catch (error) {
    next(error);
  }
}

export async function obtenerMetricaProductoAdminController(req, res, next) {
  try {
    const metrica = await obtenerMetricaProductoAdmin(req.params.productoId);
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}

export async function actualizarMetricaProductoAdminController(
  req,
  res,
  next
) {
  try {
    const metrica = await actualizarMetricaProductoAdmin(
      req.params.productoId,
      req.body
    );
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}

export async function resetearMetricaProductoAdminController(req, res, next) {
  try {
    const metrica = await resetearMetricaProductoAdmin(req.params.productoId);
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}

export async function eliminarMetricaProductoAdminController(req, res, next) {
  try {
    const metrica = await eliminarMetricaProductoAdmin(req.params.productoId);
    res.json(successResponse(metrica));
  } catch (error) {
    next(error);
  }
}
