import {
  actualizarEspecificacionProducto,
  crearEspecificacionProducto,
  eliminarEspecificacionProducto,
  obtenerEspecificacionProductoAdmin,
  obtenerEspecificacionesProductoAdmin,
} from "../services/admin.producto-especificaciones.service.js";
import { successResponse } from "../utils/response.js";

export async function listarEspecificacionesProductoAdminController(
  req,
  res,
  next
) {
  try {
    const especificaciones = await obtenerEspecificacionesProductoAdmin(
      req.params.productoId
    );
    res.json(successResponse(especificaciones));
  } catch (error) {
    next(error);
  }
}

export async function obtenerEspecificacionProductoAdminPorIdController(
  req,
  res,
  next
) {
  try {
    const especificacion = await obtenerEspecificacionProductoAdmin(
      req.params.productoId,
      req.params.especificacionId
    );
    res.json(successResponse(especificacion));
  } catch (error) {
    next(error);
  }
}

export async function crearEspecificacionProductoAdminController(
  req,
  res,
  next
) {
  try {
    const especificacion = await crearEspecificacionProducto(
      req.params.productoId,
      req.body
    );
    res.status(201).json(successResponse(especificacion));
  } catch (error) {
    next(error);
  }
}

export async function actualizarEspecificacionProductoAdminController(
  req,
  res,
  next
) {
  try {
    const especificacion = await actualizarEspecificacionProducto(
      req.params.productoId,
      req.params.especificacionId,
      req.body
    );
    res.json(successResponse(especificacion));
  } catch (error) {
    next(error);
  }
}

export async function eliminarEspecificacionProductoAdminController(
  req,
  res,
  next
) {
  try {
    const especificacion = await eliminarEspecificacionProducto(
      req.params.productoId,
      req.params.especificacionId
    );
    res.json(successResponse(especificacion));
  } catch (error) {
    next(error);
  }
}
