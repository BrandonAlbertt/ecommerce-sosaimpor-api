import { Router } from "express";
import {
  actualizarMetricaCategoriaAdminController,
  eliminarMetricaCategoriaAdminController,
  listarMetricasCategoriasAdminController,
  obtenerMetricaCategoriaAdminController,
  resetearMetricaCategoriaAdminController,
} from "../controllers/admin.categoria-metricas.controller.js";

const router = Router();

// Lista las metricas de categorias desde el panel admin.
router.get("/", listarMetricasCategoriasAdminController);
// Obtiene o crea la metrica de una categoria.
router.get("/:categoriaId", obtenerMetricaCategoriaAdminController);
// Edita manualmente los contadores de una categoria.
router.put("/:categoriaId", actualizarMetricaCategoriaAdminController);
// Edita parcialmente los contadores de una categoria.
router.patch("/:categoriaId", actualizarMetricaCategoriaAdminController);
// Resetea los contadores a cero y conserva la fila.
router.patch("/:categoriaId/reset", resetearMetricaCategoriaAdminController);
// Elimina la fila de metricas de una categoria.
router.delete("/:categoriaId", eliminarMetricaCategoriaAdminController);

export default router;
