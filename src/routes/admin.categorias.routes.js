import { Router } from "express";
import {
  activarCategoriaAdminController,
  actualizarCategoriaAdminController,
  crearCategoriaAdminController,
  desactivarCategoriaAdminController,
  listarCategoriasAdmin,
  obtenerCategoriaAdminPorIdController,
} from "../controllers/admin.categorias.controller.js";

const router = Router();

router.get("/", listarCategoriasAdmin);
router.get("/:id", obtenerCategoriaAdminPorIdController);
router.post("/", crearCategoriaAdminController);
router.put("/:id", actualizarCategoriaAdminController);
router.patch("/:id/desactivar", desactivarCategoriaAdminController);
router.patch("/:id/activar", activarCategoriaAdminController);
router.delete("/:id", desactivarCategoriaAdminController);

export default router;
