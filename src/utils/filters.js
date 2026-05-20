// ESTE ARCHIVO LO USA src/services/productos.service.js.
// CONVIERTE req.query EN TIPOS QUE EL SQL PUEDE ENTENDER.
export function getProductFilters(query) {
  // LIMPIA ESPACIOS Y DEVUELVE null SI EL TEXTO ESTA VACIO.
  const toTrimmedString = (value) => {
    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  };

  // PASA TEXTO A NUMERO CUANDO LA QUERY TRAE UN VALOR VALIDO.
  const toNumber = (value) => {
    const normalizedValue = toTrimmedString(value);
    if (!normalizedValue) return null;

    const numericValue = Number(normalizedValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  // SOLO ACEPTA true O false.
  const toBoolean = (value) => {
    const normalizedValue = toTrimmedString(value);
    if (!normalizedValue) return null;

    if (normalizedValue.toLowerCase() === "true") return true;
    if (normalizedValue.toLowerCase() === "false") return false;

    return null;
  };

  // NORMALIZA TEXTO PARA BUSQUEDAS Y COMPARACIONES.
  const toLowerCaseString = (value) => {
    const normalizedValue = toTrimmedString(value);
    return normalizedValue ? normalizedValue.toLowerCase() : null;
  };

  // OBJETO FINAL QUE EL SERVICE ENVIA AL MODELO.
  return {
    categoria_id: toNumber(query.categoria_id),
    marca: toTrimmedString(query.marca),
    modelo: toTrimmedString(query.modelo),
    tipo_producto: toTrimmedString(query.tipo_producto),
    condicion: toTrimmedString(query.condicion),
    precio_min: toNumber(query.precio_min),
    precio_max: toNumber(query.precio_max),
    stock: toNumber(query.stock),
    anio: toNumber(query.anio),
    anio_min: toNumber(query.anio_min),
    anio_max: toNumber(query.anio_max),
    disponibilidad: toLowerCaseString(query.disponibilidad),
    destacado: toBoolean(query.destacado),
    search: toTrimmedString(query.search),
  };
}
