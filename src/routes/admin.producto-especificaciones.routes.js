import { Router } from "express";
import {
  actualizarEspecificacionProductoAdminController,
  crearEspecificacionProductoAdminController,
  eliminarEspecificacionProductoAdminController,
  listarEspecificacionesProductoAdminController,
  obtenerEspecificacionProductoAdminPorIdController,
} from "../controllers/admin.producto-especificaciones.controller.js";

const router = Router({ mergeParams: true });

router.get("/", listarEspecificacionesProductoAdminController);
router.get("/:especificacionId", obtenerEspecificacionProductoAdminPorIdController);
router.post("/", crearEspecificacionProductoAdminController);
router.put("/:especificacionId", actualizarEspecificacionProductoAdminController);
router.delete("/:especificacionId", eliminarEspecificacionProductoAdminController);

export default router;
