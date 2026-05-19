import express from "express";
import cors from "cors";

import categoriasRoutes from "./routes/categorias.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
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
app.use("/api/productos", productosRoutes);
app.use("/api/configuracion", configuracionRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
