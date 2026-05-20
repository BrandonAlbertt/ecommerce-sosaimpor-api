import { Router } from "express";
import {
  activarProductoAdminController,
  actualizarProductoAdminController,
  crearProductoAdminController,
  desactivarProductoAdminController,
  listarProductosAdmin,
  obtenerProductoAdminPorIdController,
} from "../controllers/admin.productos.controller.js";

const router = Router();

router.get("/", listarProductosAdmin);
router.get("/:id", obtenerProductoAdminPorIdController);
router.post("/", crearProductoAdminController);
router.put("/:id", actualizarProductoAdminController);
router.patch("/:id/desactivar", desactivarProductoAdminController);
router.patch("/:id/activar", activarProductoAdminController);

export default router;
