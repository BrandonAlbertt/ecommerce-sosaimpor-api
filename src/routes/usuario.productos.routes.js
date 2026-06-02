import { Router } from "express";
import {
  listarFiltrosProductos,
  listarProductos,
  obtenerProductoPorSlugController,
} from "../controllers/usuario.productos.controller.js";

const router = Router();

router.get("/filtros-opciones", listarFiltrosProductos);
router.get("/:slug", obtenerProductoPorSlugController);
router.get("/", listarProductos);

export default router;
