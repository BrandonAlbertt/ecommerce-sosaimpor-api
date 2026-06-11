import { obtenerDashboardAdmin } from "../services/admin.dashboard.service.js";

export async function obtenerDashboardAdminController(_req, res, next) {
  try {
    const dashboard = await obtenerDashboardAdmin();
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}
