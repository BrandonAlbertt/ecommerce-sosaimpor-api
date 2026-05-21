import express from "express";
import cors from "cors";

import categoriasRoutes from "./routes/categorias.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
import adminProductosRoutes from "./routes/admin.productos.routes.js";
import adminCategoriasRoutes from "./routes/admin.categorias.routes.js";
import adminProductoEspecificacionesRoutes from "./routes/admin.producto-especificaciones.routes.js";
import adminProductoImagenesRoutes from "./routes/admin.producto-imagenes.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "ecommerce-sosaimpor-api",
  });
});

app.use("/api/categorias", categoriasRoutes);
// Ruta publica/user de productos. No requiere autenticacion.
app.use("/api/productos", productosRoutes);
app.use("/api/configuracion", configuracionRoutes);
// TODO: proteger rutas admin con authMiddleware y rol admin.
app.use(
  "/api/admin/productos/:productoId/especificaciones",
  adminProductoEspecificacionesRoutes
);
// TODO: proteger rutas admin con authMiddleware y rol admin.
app.use(
  "/api/admin/productos/:productoId/imagenes",
  adminProductoImagenesRoutes
);
// TODO: proteger rutas admin con authMiddleware y rol admin.
app.use("/api/admin/productos", adminProductosRoutes);
// TODO: proteger rutas admin con authMiddleware y rol admin.
app.use("/api/admin/categorias", adminCategoriasRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
