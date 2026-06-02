import { Router } from "express";
import {
  actualizarConfiguracionAdminController,
  crearConfiguracionAdminController,
  eliminarConfiguracionAdminController,
  listarConfiguracionesAdminController,
  obtenerConfiguracionAdminPorIdController,
} from "../controllers/admin.configuracion.controller.js";

const router = Router();

// Lista todas las configuraciones registradas en admin.
router.get("/", listarConfiguracionesAdminController);
// Obtiene una configuracion especifica por su id.
router.get("/:id", obtenerConfiguracionAdminPorIdController);
// Crea una nueva configuracion de tienda.
router.post("/", crearConfiguracionAdminController);
// Actualiza por completo una configuracion existente.
router.put("/:id", actualizarConfiguracionAdminController);
// Actualiza parcialmente una configuracion existente.
router.patch("/:id", actualizarConfiguracionAdminController);
// Elimina una configuracion por su id.
router.delete("/:id", eliminarConfiguracionAdminController);

export default router;
