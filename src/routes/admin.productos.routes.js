import { Router } from "express";
import {
  activarProductoAdminController,
  actualizarProductoAdminController,
  crearProductoAdminController,
  desactivarProductoAdminController,
  listarFiltrosProductosAdmin,
  listarProductosAdmin,
  obtenerProductoAdminPorIdController,
  obtenerResumenProductosAdminController,
} from "../controllers/admin.productos.controller.js";

const router = Router();

router.get("/", listarProductosAdmin);
router.get("/filtros-opciones", listarFiltrosProductosAdmin);
router.get("/resumen", obtenerResumenProductosAdminController);
router.get("/:id", obtenerProductoAdminPorIdController);
router.post("/", crearProductoAdminController);
router.put("/:id", actualizarProductoAdminController);
router.patch("/:id", actualizarProductoAdminController);
router.patch("/:id/desactivar", desactivarProductoAdminController);
router.patch("/:id/activar", activarProductoAdminController);

export default router;
