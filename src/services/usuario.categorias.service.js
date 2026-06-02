import {
  listarCategoriasDestacadas,
  obtenerLimiteCategoriasDestacadasConfig,
} from "../models/categorias.model.js";

export async function obtenerCategoriasDestacadas() {
  const limit = await obtenerLimiteCategoriasDestacadasConfig();
  return listarCategoriasDestacadas(limit);
}
