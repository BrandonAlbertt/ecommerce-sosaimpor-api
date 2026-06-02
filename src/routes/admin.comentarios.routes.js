import { Router } from "express";
import {
  actualizarComentarioAdminController,
  eliminarComentarioAdminController,
  listarComentariosAdminController,
  obtenerComentarioAdminPorIdController,
  vaciarComentariosAdminController,
} from "../controllers/admin.comentarios.controller.js";

const router = Router();

// Lista todos los comentarios desde el panel admin.
router.get("/", listarComentariosAdminController);
// Vacia toda la tabla de comentarios.
router.delete("/vaciar", vaciarComentariosAdminController);
// Obtiene un comentario por su id.
router.get("/:id", obtenerComentarioAdminPorIdController);
// Edita un comentario existente.
router.put("/:id", actualizarComentarioAdminController);
// Edita parcialmente un comentario existente.
router.patch("/:id", actualizarComentarioAdminController);
// Elimina un comentario por su id.
router.delete("/:id", eliminarComentarioAdminController);

export default router;
