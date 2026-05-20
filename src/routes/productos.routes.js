import { Router } from "express";
import {
  listarFiltrosProductos,
  listarProductos,
} from "../controllers/productos.controller.js";

const router = Router();

router.get("/filtros-opciones", listarFiltrosProductos);
router.get("/", listarProductos);

export default router;
