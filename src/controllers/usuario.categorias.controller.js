import { obtenerCategoriasDestacadas } from "../services/usuario.categorias.service.js";
import { successResponse } from "../utils/response.js";

export async function listarCategoriasDestacadasController(req, res, next) {
  try {
    const categorias = await obtenerCategoriasDestacadas();
    res.json(successResponse(categorias));
  } catch (error) {
    next(error);
  }
}
