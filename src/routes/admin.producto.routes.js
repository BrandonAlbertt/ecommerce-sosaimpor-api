import { Router } from "express";
import { eliminarProductoAdminController } from "../controllers/admin.productos.controller.js";

const router = Router();

router.delete("/delete/:id", eliminarProductoAdminController);

export default router;
