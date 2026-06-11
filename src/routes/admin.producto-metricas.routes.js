import { Router } from "express";
import {
  actualizarMetricaProductoAdminController,
  eliminarMetricaProductoAdminController,
  listarMetricasProductosAdminController,
  obtenerMetricaProductoAdminController,
  resetearMetricaProductoAdminController,
} from "../controllers/admin.producto-metricas.controller.js";

const router = Router();

// Lista las metricas de productos desde el panel admin.
router.get("/", listarMetricasProductosAdminController);
// Obtiene o crea la metrica de un producto.
router.get("/:productoId", obtenerMetricaProductoAdminController);
// Edita manualmente las vistas de un producto.
router.put("/:productoId", actualizarMetricaProductoAdminController);
// Edita parcialmente las vistas de un producto.
router.patch("/:productoId", actualizarMetricaProductoAdminController);
// Resetea las vistas a cero y conserva la fila.
router.patch("/:productoId/reset", resetearMetricaProductoAdminController);
// Elimina la fila de metricas de un producto.
router.delete("/:productoId", eliminarMetricaProductoAdminController);

export default router;
