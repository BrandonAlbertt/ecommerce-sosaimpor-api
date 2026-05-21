import {
  actualizarEspecificacionProductoAdmin,
  crearEspecificacionProductoAdmin,
  eliminarEspecificacionProductoAdmin,
  listarEspecificacionesProductoAdmin,
  obtenerEspecificacionProductoAdminPorId,
  productoEspecificacionProductoExiste,
} from "../models/producto-especificaciones.model.js";

const allowedEspecificacionFields = ["nombre", "valor"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parsePositiveId(id, entityName) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError(`id de ${entityName} invalido`);
  }

  return numericId;
}

function toTrimmedRequiredString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw createHttpError(`${fieldName} es obligatorio`);
  }

  return value.trim();
}

function pickEspecificacionData(data, { partial = false } = {}) {
  const especificacionData = {};

  for (const field of allowedEspecificacionFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      especificacionData[field] = data[field];
    }
  }

  if (!partial) {
    especificacionData.nombre = toTrimmedRequiredString(
      especificacionData.nombre,
      "nombre"
    );
    especificacionData.valor = toTrimmedRequiredString(
      especificacionData.valor,
      "valor"
    );
  }

  for (const field of allowedEspecificacionFields) {
    if (especificacionData[field] !== undefined) {
      especificacionData[field] = toTrimmedRequiredString(
        especificacionData[field],
        field
      );
    }
  }

  if (
    especificacionData.nombre !== undefined &&
    especificacionData.nombre.length > 120
  ) {
    throw createHttpError("nombre debe tener 120 caracteres o menos");
  }

  return especificacionData;
}

async function validateProducto(productoId) {
  const exists = await productoEspecificacionProductoExiste(productoId);

  if (!exists) {
    throw createHttpError("Producto no encontrado", 404);
  }
}

async function getEspecificacion(productoId, especificacionId) {
  const especificacion = await obtenerEspecificacionProductoAdminPorId(
    productoId,
    especificacionId
  );

  if (!especificacion) {
    throw createHttpError("Especificacion no encontrada", 404);
  }

  return especificacion;
}

export async function obtenerEspecificacionesProductoAdmin(productoId) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  await validateProducto(parsedProductoId);

  return listarEspecificacionesProductoAdmin(parsedProductoId);
}

export async function obtenerEspecificacionProductoAdmin(
  productoId,
  especificacionId
) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedEspecificacionId = parsePositiveId(
    especificacionId,
    "especificacion"
  );

  await validateProducto(parsedProductoId);
  return getEspecificacion(parsedProductoId, parsedEspecificacionId);
}

export async function crearEspecificacionProducto(productoId, data) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const especificacionData = pickEspecificacionData(data);

  await validateProducto(parsedProductoId);
  return crearEspecificacionProductoAdmin(parsedProductoId, especificacionData);
}

export async function actualizarEspecificacionProducto(
  productoId,
  especificacionId,
  data
) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedEspecificacionId = parsePositiveId(
    especificacionId,
    "especificacion"
  );

  await validateProducto(parsedProductoId);
  await getEspecificacion(parsedProductoId, parsedEspecificacionId);

  const especificacionData = pickEspecificacionData(data, { partial: true });
  const especificacion = await actualizarEspecificacionProductoAdmin(
    parsedProductoId,
    parsedEspecificacionId,
    especificacionData
  );

  if (!especificacion) {
    throw createHttpError("Especificacion no encontrada", 404);
  }

  return especificacion;
}

export async function eliminarEspecificacionProducto(
  productoId,
  especificacionId
) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedEspecificacionId = parsePositiveId(
    especificacionId,
    "especificacion"
  );

  await validateProducto(parsedProductoId);

  const especificacion = await eliminarEspecificacionProductoAdmin(
    parsedProductoId,
    parsedEspecificacionId
  );

  if (!especificacion) {
    throw createHttpError("Especificacion no encontrada", 404);
  }

  return especificacion;
}
