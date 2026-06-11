import { Router } from "express";
import { registrarVistaCategoriaController } from "../controllers/usuario.categoria-metricas.controller.js";

const router = Router();

// Registra que un usuario visito una categoria.
router.post("/:categoriaId/vista", registrarVistaCategoriaController);

export default router;
