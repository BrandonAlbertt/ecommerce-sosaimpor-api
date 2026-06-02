import { Router } from "express";
import { listarCategoriasDestacadasController } from "../controllers/usuario.categorias.controller.js";

const router = Router();

// Lista las categorias destacadas para el frontend publico.
router.get("/destacadas", listarCategoriasDestacadasController);

export default router;
