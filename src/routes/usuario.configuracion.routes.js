import { Router } from "express";
import { obtenerConfiguracionPublicaController } from "../controllers/usuario.configuracion.controller.js";

const router = Router();

// Obtiene la configuracion publica de la tienda para el frontend.
router.get("/", obtenerConfiguracionPublicaController);

export default router;
