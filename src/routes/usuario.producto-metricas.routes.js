import { Router } from "express";
import { registrarVistaProductoController } from "../controllers/usuario.producto-metricas.controller.js";

const router = Router();

// Registra que un usuario visito un producto.
router.post("/:productoId/vista", registrarVistaProductoController);

export default router;
