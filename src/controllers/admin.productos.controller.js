import {
  activarProducto,
  actualizarProducto,
  crearProducto,
  desactivarProducto,
  eliminarProducto,
  obtenerFiltrosProductosAdmin,
  obtenerProductoAdmin,
  obtenerProductosAdmin,
  obtenerResumenAdminProductos,
} from "../services/admin.productos.service.js";
import { successResponse } from "../utils/response.js";

export async function listarProductosAdmin(req, res, next) {
  try {
    const resultado = await obtenerProductosAdmin(req.query);
    res.json(successResponse(resultado.data, resultado.pagination));
  } catch (error) {
    next(error);
  }
}

export async function listarFiltrosProductosAdmin(_req, res, next) {
  try {
    const filtros = await obtenerFiltrosProductosAdmin();
    res.json(successResponse(filtros));
  } catch (error) {
    next(error);
  }
}

export async function obtenerResumenProductosAdminController(_req, res, next) {
  try {
    const resumen = await obtenerResumenAdminProductos();
    res.json(successResponse(resumen));
  } catch (error) {
    next(error);
  }
}

export async function obtenerProductoAdminPorIdController(req, res, next) {
  try {
    const producto = await obtenerProductoAdmin(req.params.id);
    res.json(successResponse(producto));
  } catch (error) {
    next(error);
  }
}

export async function crearProductoAdminController(req, res, next) {
  try {
    const producto = await crearProducto(req.body);
    res.status(201).json(successResponse(producto));
  } catch (error) {
    next(error);
  }
}

export async function actualizarProductoAdminController(req, res, next) {
  try {
    const producto = await actualizarProducto(req.params.id, req.body);
    res.json(successResponse(producto));
  } catch (error) {
    next(error);
  }
}

export async function desactivarProductoAdminController(req, res, next) {
  try {
    const producto = await desactivarProducto(req.params.id);
    res.json(successResponse(producto));
  } catch (error) {
    next(error);
  }
}

export async function activarProductoAdminController(req, res, next) {
  try {
    const producto = await activarProducto(req.params.id);
    res.json(successResponse(producto));
  } catch (error) {
    next(error);
  }
}

export async function eliminarProductoAdminController(req, res, next) {
  try {
    const producto = await eliminarProducto(req.params.id);
    res.json(successResponse(producto));
  } catch (error) {
    next(error);
  }
}
