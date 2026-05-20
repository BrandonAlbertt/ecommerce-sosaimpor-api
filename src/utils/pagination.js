const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

// ESTE ARCHIVO LO USA src/services/productos.service.js.
// CALCULA LA PAGINACION PARA QUE EL MODELO SOLO TRAIGA UNA PARTE DE LOS DATOS.
export function getPagination(query) {
  // SI NO VIENE page, USA 1 COMO PRIMERA PAGINA.
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  // limit POR DEFECTO Y LIMITE MAXIMO PARA NO SOBRECARGAR LA CONSULTA.
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  // offset = CUANTOS REGISTROS SE SALTAN SEGUN LA PAGINA.
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}
