import {
  activarCategoria,
  actualizarCategoria,
  actualizarConfiguracionCategoriasDestacadas,
  crearCategoria,
  desactivarCategoria,
  eliminarCategoria,
  obtenerConfiguracionCategoriasDestacadas,
  obtenerCategoriaAdmin,
  obtenerCategoriasAdmin,
  obtenerResumenCategorias,
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

export async function obtenerResumenCategoriasAdminController(_req, res, next) {
  try {
    const resumen = await obtenerResumenCategorias();
    res.json(successResponse(resumen));
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
    const categoria = await crearCategoria(req.body, req.file);
    res.status(201).json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}

export async function actualizarCategoriaAdminController(req, res, next) {
  try {
    const categoria = await actualizarCategoria(
      req.params.id,
      req.body,
      req.file
    );
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

export async function eliminarCategoriaAdminController(req, res, next) {
  try {
    const categoria = await eliminarCategoria(req.params.id);
    res.json(successResponse(categoria));
  } catch (error) {
    next(error);
  }
}
