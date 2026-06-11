import { memoryCache } from "../utils/cache.js";

// MIDDLEWARE PARA LIMPIAR LA CACHE AUTOMATICAMENTE ANTE CAMBIOS.
// Intercepta peticiones POST, PUT, PATCH o DELETE y limpia la caché
// si la operación fue exitosa, excepto para registros de métricas.
export function cacheInvalidatorMiddleware(req, res, next) {
  const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const path = req.originalUrl;

  // Evitamos invalidar la caché por registro de vistas/métricas de usuarios
  const isMetricRoute = path.includes("metricas") || path.includes("/vista");

  if (isWriteMethod && !isMetricRoute) {
    res.on("finish", () => {
      // Solo limpiamos si la respuesta fue exitosa (200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // console.log(`[cache] Invalidador detecto cambio via ${req.method} en ${path}`);
        memoryCache.clear();
      }
    });
  }

  next();
}

export default cacheInvalidatorMiddleware;
