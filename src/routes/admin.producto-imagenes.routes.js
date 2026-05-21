import { Router } from "express";
import {
  actualizarImagenProductoAdminController,
  crearImagenProductoAdminController,
  eliminarImagenProductoAdminController,
  listarImagenesProductoAdminController,
  marcarImagenProductoPrincipalAdminController,
  obtenerImagenProductoAdminPorIdController,
  reemplazarImagenProductoAdminController,
} from "../controllers/admin.producto-imagenes.controller.js";
import { subirImagenProducto } from "../middlewares/upload-imagen.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", listarImagenesProductoAdminController);
router.get("/:imagenId", obtenerImagenProductoAdminPorIdController);
router.post("/", subirImagenProducto, crearImagenProductoAdminController);
router.put("/:imagenId", actualizarImagenProductoAdminController);
router.patch(
  "/:imagenId/principal",
  marcarImagenProductoPrincipalAdminController
);
router.put(
  "/:imagenId/reemplazar",
  subirImagenProducto,
  reemplazarImagenProductoAdminController
);
router.delete("/:imagenId", eliminarImagenProductoAdminController);

export default router;
