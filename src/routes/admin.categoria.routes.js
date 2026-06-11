import { Router } from "express";
import { eliminarCategoriaAdminController } from "../controllers/admin.categorias.controller.js";

const router = Router();

router.delete("/delete/:id", eliminarCategoriaAdminController);

export default router;
