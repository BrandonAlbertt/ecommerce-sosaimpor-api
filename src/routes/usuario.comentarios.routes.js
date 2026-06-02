import { Router } from "express";
import { crearComentarioUsuarioController } from "../controllers/usuario.comentarios.controller.js";

const router = Router();

// Permite que el usuario cree un comentario desde la pagina.
router.post("/", crearComentarioUsuarioController);

export default router;
