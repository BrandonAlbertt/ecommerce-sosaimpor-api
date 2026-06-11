import express from "express";
import cors from "cors";

import categoriasRoutes from "./routes/usuario.categorias.routes.js";
import productosRoutes from "./routes/usuario.productos.routes.js";
import configuracionRoutes from "./routes/usuario.configuracion.routes.js";
import comentariosRoutes from "./routes/usuario.comentarios.routes.js";
import categoriaMetricasRoutes from "./routes/usuario.categoria-metricas.routes.js";
import productoMetricasRoutes from "./routes/usuario.producto-metricas.routes.js";
import adminComentariosRoutes from "./routes/admin.comentarios.routes.js";
import adminConfiguracionRoutes from "./routes/admin.configuracion.routes.js";
import adminCategoriaMetricasRoutes from "./routes/admin.categoria-metricas.routes.js";
import adminProductoMetricasRoutes from "./routes/admin.producto-metricas.routes.js";
import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import adminProductoRoutes from "./routes/admin.producto.routes.js";
import adminProductosRoutes from "./routes/admin.productos.routes.js";
import adminCategoriaRoutes from "./routes/admin.categoria.routes.js";
import adminCategoriasRoutes from "./routes/admin.categorias.routes.js";
import adminProductoEspecificacionesRoutes from "./routes/admin.producto-especificaciones.routes.js";
import adminProductoImagenesRoutes from "./routes/admin.producto-imagenes.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";
import { authAdminMiddleware } from "./middlewares/auth-admin.middleware.js";
import { cacheInvalidatorMiddleware } from "./middlewares/cache-invalidator.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cacheInvalidatorMiddleware);


app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "ecommerce-sosaimpor-api",
  });
});

// Rutas Públicas (Usuario)
app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/comentarios", comentariosRoutes);
app.use("/api/categoria-metricas", categoriaMetricasRoutes);
app.use("/api/producto-metricas", productoMetricasRoutes);

// ==========================================
// Proteccion Global para Rutas de Administrador
// ==========================================
// El authAdminMiddleware verifica que se envíe el header 'x-api-key' con 
// el valor de ADMIN_API_KEY definido en el archivo .env.
// Al aplicarse en el prefijo '/api/admin', protege de una sola vez 
// a todas las rutas declaradas a continuación.
app.use("/api/admin", authAdminMiddleware);

// Rutas Protegidas (Admin)
app.use(
  "/api/admin/productos/:productoId/especificaciones",
  adminProductoEspecificacionesRoutes
);
app.use(
  "/api/admin/productos/:productoId/imagenes",
  adminProductoImagenesRoutes
);
app.use("/api/admin/configuracion", adminConfiguracionRoutes);
app.use("/api/admin/comentarios", adminComentariosRoutes);
app.use("/api/admin/categoria-metricas", adminCategoriaMetricasRoutes);
app.use("/api/admin/producto-metricas", adminProductoMetricasRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/producto", adminProductoRoutes);
app.use("/api/admin/productos", adminProductosRoutes);
app.use("/api/admin/categoria", adminCategoriaRoutes);
app.use("/api/admin/categorias", adminCategoriasRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
