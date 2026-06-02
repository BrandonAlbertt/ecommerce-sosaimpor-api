import { Router } from "express";
import {
  activarCategoriaAdminController,
  actualizarCategoriaAdminController,
  actualizarConfiguracionCategoriasDestacadasController,
  crearCategoriaAdminController,
  desactivarCategoriaAdminController,
  listarCategoriasAdmin,
  obtenerConfiguracionCategoriasDestacadasController,
  obtenerCategoriaAdminPorIdController,
} from "../controllers/admin.categorias.controller.js";

const router = Router();

// Lista todas las categorias desde el panel admin, con filtros y paginacion.
router.get("/", listarCategoriasAdmin);
// Devuelve la configuracion de categorias destacadas.
router.get(
  "/configuracion/destacadas",
  obtenerConfiguracionCategoriasDestacadasController
);
// Actualiza la configuracion de categorias destacadas.
router.patch(
  "/configuracion/destacadas",
  actualizarConfiguracionCategoriasDestacadasController
);
// Obtiene una categoria admin por su id.
router.get("/:id", obtenerCategoriaAdminPorIdController);
// Crea una nueva categoria desde admin.
router.post("/", crearCategoriaAdminController);
// Actualiza una categoria existente desde admin.
router.put("/:id", actualizarCategoriaAdminController);
// Desactiva una categoria sin eliminarla fisicamente.
router.patch("/:id/desactivar", desactivarCategoriaAdminController);
// Reactiva una categoria desactivada.
router.patch("/:id/activar", activarCategoriaAdminController);
// Elimina o desactiva una categoria segun la logica del servicio.
router.delete("/:id", desactivarCategoriaAdminController);

export default router;
