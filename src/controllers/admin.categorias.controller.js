import {
  activarCategoria,
  actualizarCategoria,
  actualizarConfiguracionCategoriasDestacadas,
  crearCategoria,
  desactivarCategoria,
  obtenerConfiguracionCategoriasDestacadas,
  obtenerCategoriaAdmin,
  obtenerCategoriasAdmin,
} from "../services/admin.categorias.service.js";
import { successResponse } from "../utils/response.js";

export async function listarCategoriasAdmin(req, res, next) {
  try {
    const resultado = await obtenerCategoriasAdmin(req.query);
    res.json(successResponse(resultado.data, resultado.pagination));
  } catch (error) {
    next(error);
  }
}

export async function obtenerConfiguracionCategoriasDestacadasController(
  _req,
  res,
  next
) {
  try {
    const configuracion = await obtenerConfiguracionCategoriasDestacadas();
    res.json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}

export async function actualizarConfiguracionCategoriasDestacadasController(
  req,
  res,
  next
) {
  try {
    const configuracion = await actualizarConfiguracionCategoriasDestacadas(
      req.body
    );
    res.json(successResponse(configuracion));
  } catch (error) {
    next(error);
  }
}

export async function obtenerCategoriaAdminPorIdController(req, res, next) {
  try {
    const categoria = await obtenerCategoriaAdmin(req.params.id);
    res.json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}

export async function crearCategoriaAdminController(req, res, next) {
  try {
    const categoria = await crearCategoria(req.body);
    res.status(201).json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}

export async function actualizarCategoriaAdminController(req, res, next) {
  try {
    const categoria = await actualizarCategoria(req.params.id, req.body);
    res.json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}

export async function desactivarCategoriaAdminController(req, res, next) {
  try {
    const categoria = await desactivarCategoria(req.params.id);
    res.json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}

export async function activarCategoriaAdminController(req, res, next) {
  try {
    const categoria = await activarCategoria(req.params.id);
    res.json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}
