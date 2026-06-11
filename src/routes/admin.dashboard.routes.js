import { Router } from "express";
import { obtenerDashboardAdminController } from "../controllers/admin.dashboard.controller.js";

const router = Router();

router.get("/", obtenerDashboardAdminController);

export default router;
