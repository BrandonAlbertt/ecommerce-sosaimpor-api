import {
  actualizarConfiguracionTienda,
  crearConfiguracionTienda,
  eliminarConfiguracionTienda,
  listarConfiguracionesTienda,
  obtenerConfiguracionTiendaActiva,
  obtenerConfiguracionTiendaPorId,
} from "../models/configuracion.model.js";

// ESTE JS ES UN SERVICIO DE CONFIGURACION DE LA TIENDA.
// LO USA EL CONTROLLER PARA LEER, CREAR, ACTUALIZAR Y ELIMINAR DATOS DE LA TIENDA.
const configuracionTiendaFields = [
  "banner_primary_message",
  "banner_secondary_message",
  "banner_tertiary_message",
  "banner_subtitle",
  "banner_title",
  "header_help_label",
  "header_location_label",
  "header_location_sub_label",
  "header_phone_label",
  "header_primary_message",
  "header_schedule_friday",
  "header_schedule_saturday",
  "header_shipping_badge",
  "header_secondary_message",
  "header_whatsapp_label",
  "header_whatsapp_sub_label",
  "header_whatsapp_url",
  "location_display_address",
  "location_display_district",
  "seller_whatsapp_url",
  "featured_categories_limit",
  "comment_min_interval_minutes",
  "comment_daily_limit",
  "is_active",
];

const positiveIntegerFields = new Set([
  "featured_categories_limit",
  "comment_min_interval_minutes",
  "comment_daily_limit",
]);

// CREA UN ERROR HTTP PERSONALIZADO.
function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// CONVIERTE Y VALIDA EL ID DE CONFIGURACION.
function parseConfigId(id) {
  const numericId = Number(id);

  // RECHAZA IDS INVALIDOS.
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError("id de configuracion invalido");
  }

  return numericId;
}

// LIMPIA VALORES DE TEXTO OPCIONALES.
function toOptionalString(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null) {
    throw createHttpError(`${fieldName} es obligatorio`);
  }
  if (typeof value !== "string") return value;

  const trimmedValue = value.trim();
  if (trimmedValue) return trimmedValue;
  throw createHttpError(`${fieldName} es obligatorio`);
}

// NORMALIZA BOOLEANOS OPCIONALES.
function toOptionalBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (["true", "1", "si"].includes(normalizedValue)) return true;
    if (["false", "0", "no"].includes(normalizedValue)) return false;
  }

  throw createHttpError(`${fieldName} debe ser booleano`);
}

// VALIDA ENTEROS POSITIVOS OPCIONALES.
function toOptionalPositiveInteger(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === "") {
    throw createHttpError(`${fieldName} es obligatorio`);
  }

  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw createHttpError(`${fieldName} debe ser un entero positivo`);
  }

  return numericValue;
}

// FILTRA Y NORMALIZA SOLO LOS CAMPOS PERMITIDOS DE CONFIGURACION.
function pickConfiguracionTiendaData(data, options = {}) {
  const configuracionData = {};
  const sourceData = data && typeof data === "object" ? data : {};

  // TOMA SOLO LOS CAMPOS DEFINIDOS EN LA LISTA.
  for (const field of configuracionTiendaFields) {
    if (Object.prototype.hasOwnProperty.call(sourceData, field)) {
      configuracionData[field] = sourceData[field];
    }
  }

  // LIMPIA LOS CAMPOS DE TEXTO Y NORMALIZA EL ESTADO ACTIVO.
  for (const field of configuracionTiendaFields) {
    if (configuracionData[field] === undefined) continue;

    if (field === "is_active") {
      configuracionData[field] = toOptionalBoolean(
        configuracionData[field],
        field
      );
    } else if (positiveIntegerFields.has(field)) {
      configuracionData[field] = toOptionalPositiveInteger(
        configuracionData[field],
        field
      );
    } else {
      configuracionData[field] = toOptionalString(
        configuracionData[field],
        field
      );
    }
  }

  // ELIMINA CAMPOS QUE QUEDARON SIN VALOR.
  for (const [field, value] of Object.entries(configuracionData)) {
    if (value === undefined) {
      delete configuracionData[field];
    }
  }

  // EVITA GUARDAR PETICIONES VACIAS.
  if (!options.allowEmpty && !Object.keys(configuracionData).length) {
    throw createHttpError("No hay campos validos para guardar");
  }

  return configuracionData;
}

// OBTIENE TODAS LAS CONFIGURACIONES DE LA TIENDA.
export async function obtenerConfiguracionesTienda() {
  return listarConfiguracionesTienda();
}

// OBTIENE LA CONFIGURACION ACTIVA PARA EL FRONTEND.
export async function obtenerConfiguracionPublicaTienda() {
  return obtenerConfiguracionTiendaActiva();
}

// OBTIENE UNA CONFIGURACION POR ID.
export async function obtenerConfiguracionTienda(id) {
  const configId = parseConfigId(id);
  const configuracion = await obtenerConfiguracionTiendaPorId(configId);

  // LANZA ERROR SI NO EXISTE.
  if (!configuracion) {
    throw createHttpError("Configuracion no encontrada", 404);
  }

  return configuracion;
}

// CREA UNA CONFIGURACION NUEVA.
export async function crearConfiguracion(data) {
  const configuracionData = pickConfiguracionTiendaData(data, {
    allowEmpty: true,
  });

  if (!Object.prototype.hasOwnProperty.call(configuracionData, "is_active")) {
    configuracionData.is_active = false;
  }

  return crearConfiguracionTienda(configuracionData);
}

// ACTUALIZA UNA CONFIGURACION EXISTENTE.
export async function actualizarConfiguracion(id, data) {
  const configId = parseConfigId(id);
  const configuracionData = pickConfiguracionTiendaData(data);
  const configuracion = await actualizarConfiguracionTienda(
    configId,
    configuracionData
  );

  // LANZA ERROR SI NO EXISTE.
  if (!configuracion) {
    throw createHttpError("Configuracion no encontrada", 404);
  }

  return configuracion;
}

// ELIMINA UNA CONFIGURACION EXISTENTE.
export async function eliminarConfiguracion(id) {
  const configId = parseConfigId(id);
  const configuracion = await eliminarConfiguracionTienda(configId);

  // LANZA ERROR SI NO EXISTE.
  if (!configuracion) {
    throw createHttpError("Configuracion no encontrada", 404);
  }

  return configuracion;
}
