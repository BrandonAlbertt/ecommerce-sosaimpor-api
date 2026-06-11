import {
  listarCategoriasDestacadas,
  obtenerLimiteCategoriasDestacadasConfig,
} from "../models/categorias.model.js";
import { memoryCache } from "../utils/cache.js";

export async function obtenerCategoriasDestacadas() {
  const cacheKey = "categorias_destacadas";
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    // console.log("[cache] Entregando categorias destacadas desde cache");
    return cached;
  }

  const limit = await obtenerLimiteCategoriasDestacadasConfig();
  const result = await listarCategoriasDestacadas(limit);

  // Guardar en cache por 15 minutos (900 segundos)
  memoryCache.set(cacheKey, result, 900);

  return result;
}

