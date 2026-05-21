import {
  actualizarImagenProducto,
  crearImagenProducto,
  eliminarImagenProducto,
  marcarImagenProductoPrincipal,
  obtenerImagenProductoAdmin,
  obtenerImagenesProductoAdmin,
  reemplazarImagenProducto,
} from "../services/admin.producto-imagenes.service.js";
import { successResponse } from "../utils/response.js";

export async function listarImagenesProductoAdminController(req, res, next) {
  try {
    const imagenes = await obtenerImagenesProductoAdmin(req.params.productoId);
    res.json(successResponse(imagenes));
  } catch (error) {
    next(error);
  }
}

export async function obtenerImagenProductoAdminPorIdController(
  req,
  res,
  next
) {
  try {
    const imagen = await obtenerImagenProductoAdmin(
      req.params.productoId,
      req.params.imagenId
    );
    res.json(successResponse(imagen));
  } catch (error) {
    next(error);
  }
}

export async function crearImagenProductoAdminController(req, res, next) {
  try {
    const imagen = await crearImagenProducto(
      req.params.productoId,
      req.file,
      req.body
    );
    res.status(201).json(successResponse(imagen));
  } catch (error) {
    next(error);
  }
}

export async function actualizarImagenProductoAdminController(req, res, next) {
  try {
    const imagen = await actualizarImagenProducto(
      req.params.productoId,
      req.params.imagenId,
      req.body
    );
    res.json(successResponse(imagen));
  } catch (error) {
    next(error);
  }
}

export async function marcarImagenProductoPrincipalAdminController(
  req,
  res,
  next
) {
  try {
    const imagen = await marcarImagenProductoPrincipal(
      req.params.productoId,
      req.params.imagenId
    );
    res.json(successResponse(imagen));
  } catch (error) {
    next(error);
  }
}

export async function reemplazarImagenProductoAdminController(req, res, next) {
  try {
    const imagen = await reemplazarImagenProducto(
      req.params.productoId,
      req.params.imagenId,
      req.file
    );
    res.json(successResponse(imagen));
  } catch (error) {
    next(error);
  }
}

export async function eliminarImagenProductoAdminController(req, res, next) {
  try {
    const imagen = await eliminarImagenProducto(
      req.params.productoId,
      req.params.imagenId
    );
    res.json(successResponse(imagen));
  } catch (error) {
    next(error);
  }
}
