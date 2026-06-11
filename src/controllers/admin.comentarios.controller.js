import {
  actualizarComentarioAdmin,
  eliminarComentarioAdmin,
  obtenerComentarioAdmin,
  obtenerComentariosAdmin,
  vaciarComentariosAdmin,
} from "../services/comentario.service.js";
import { successResponse } from "../utils/response.js";

export async function listarComentariosAdminController(req, res, next) {
  try {
    const resultado = await obtenerComentariosAdmin(req.query);
    res.json(successResponse(resultado.data, resultado.pagination));
  } catch (error) {
    next(error);
  }
}

export async function obtenerComentarioAdminPorIdController(req, res, next) {
  try {
    const comentario = await obtenerComentarioAdmin(req.params.id);
    res.json(successResponse(comentario));
  } catch (error) {
    next(error);
  }
}

export async function actualizarComentarioAdminController(req, res, next) {
  try {
    const comentario = await actualizarComentarioAdmin(
      req.params.id,
      req.body
    );
    res.json(successResponse(comentario));
  } catch (error) {
    next(error);
  }
}

export async function eliminarComentarioAdminController(req, res, next) {
  try {
    const comentario = await eliminarComentarioAdmin(req.params.id);
    res.json(successResponse(comentario));
  } catch (error) {
    next(error);
  }
}

export async function vaciarComentariosAdminController(_req, res, next) {
  try {
    const resultado = await vaciarComentariosAdmin();
    res.json(successResponse(resultado));
  } catch (error) {
    next(error);
  }
}
