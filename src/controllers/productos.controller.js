import {
  obtenerFiltrosProductos,
  obtenerProductos,
} from "../services/productos.service.js";
import { successResponse } from "../utils/response.js";

// ESTE ARCHIVO LO LLAMA src/routes/productos.routes.js.
// AQUI SE RECIBE req.query Y SE ENVIA LA RESPUESTA JSON AL FRONTEND.
// ESTE PASO TOMA LOS DATOS DE LA URL Y LOS ENVIA AL SERVICE.
export async function listarProductos(req, res, next) {
  try {
    // DEBUG: MUESTRA LA RUTA Y LOS PARAMETROS QUE LLEGAN POR QUERY.
    console.log("[productos] Request recibida:", {
      method: req.method,
      path: req.originalUrl,
      query: req.query,
    });

    // LISTAR PRODUCTOS: LLAMA AL SERVICE QUE ARMAR FILTROS Y PAGINACION.
    const resultado = await obtenerProductos(req.query);

    // RESPUESTA ESTANDAR: ENVIA DATA Y METADATA DE PAGINACION.
    res.json(successResponse(resultado.data, resultado.pagination));
  } catch (error) {
    next(error);
  }
}

// ESTE ENDPOINT LO USA EL FRONTEND PARA CARGAR LOS SELECTORES DE FILTROS.
// TAMBIEN BAJA LA PETICION DESDE LA RUTA HASTA EL SERVICE DE OPCIONES.
export async function listarFiltrosProductos(_req, res, next) {
  try {
    // OBTENER FILTROS: LLAMA AL SERVICE QUE CONSULTA OPCIONES UNICAS.
    console.log("[productos] Request de opciones de filtros");

    const filtros = await obtenerFiltrosProductos();

    // RESPUESTA ESTANDAR: DEVUELVE OPCIONES PARA MARCA, MODELO, ANIO, ETC.
    res.json(successResponse(filtros));
  } catch (error) {
    next(error);
  }
}
