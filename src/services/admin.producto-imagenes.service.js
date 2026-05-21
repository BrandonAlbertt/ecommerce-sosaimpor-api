import {
  actualizarImagenProductoAdmin,
  crearImagenProductoAdmin,
  eliminarImagenProductoAdmin,
  listarImagenesProductoAdmin,
  marcarImagenProductoAdminPrincipal,
  obtenerImagenProductoAdminPorId,
  productoImagenProductoExiste,
  reemplazarImagenProductoAdmin,
} from "../models/producto-imagenes.model.js";
import {
  eliminarImagenCloudinary,
  subirImagenProductoCloudinary,
} from "./cloudinary-imagenes.service.js";

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

function toOptionalBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }

  throw createHttpError(`${fieldName} debe ser true o false`);
}

function toOptionalInteger(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return 0;

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw createHttpError(`${fieldName} debe ser un entero mayor o igual a 0`);
  }

  return numericValue;
}

function pickCreateImageData(data) {
  const imageData = {
    principal: toOptionalBoolean(data.principal, "principal"),
    orden: toOptionalInteger(data.orden, "orden"),
  };

  if (imageData.principal === undefined) {
    imageData.principal = false;
  }

  if (imageData.orden === undefined) {
    imageData.orden = 0;
  }

  return imageData;
}

function pickUpdateImageData(data) {
  const imageData = {};

  if (Object.prototype.hasOwnProperty.call(data, "orden")) {
    imageData.orden = toOptionalInteger(data.orden, "orden");
  }

  return imageData;
}

function validarArchivoImagen(file) {
  if (!file) {
    throw createHttpError("imagen es obligatoria");
  }
}

async function validateProducto(productoId) {
  const exists = await productoImagenProductoExiste(productoId);

  if (!exists) {
    throw createHttpError("Producto no encontrado", 404);
  }
}

async function getImagen(productoId, imagenId) {
  const imagen = await obtenerImagenProductoAdminPorId(productoId, imagenId);

  if (!imagen) {
    throw createHttpError("Imagen no encontrada", 404);
  }

  return imagen;
}

async function limpiarImagenCloudinary(publicId) {
  try {
    await eliminarImagenCloudinary(publicId);
  } catch (error) {
    console.error("[cloudinary] No se pudo limpiar imagen:", {
      publicId,
      message: error.message,
    });
  }
}

export async function obtenerImagenesProductoAdmin(productoId) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  await validateProducto(parsedProductoId);

  return listarImagenesProductoAdmin(parsedProductoId);
}

export async function obtenerImagenProductoAdmin(productoId, imagenId) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedImagenId = parsePositiveId(imagenId, "imagen");

  await validateProducto(parsedProductoId);
  return getImagen(parsedProductoId, parsedImagenId);
}

export async function crearImagenProducto(productoId, file, data) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  validarArchivoImagen(file);
  await validateProducto(parsedProductoId);

  const uploadData = await subirImagenProductoCloudinary(file, parsedProductoId);
  const imageData = {
    ...pickCreateImageData(data),
    ...uploadData,
  };

  try {
    return await crearImagenProductoAdmin(parsedProductoId, imageData);
  } catch (error) {
    await limpiarImagenCloudinary(uploadData.public_id);
    throw error;
  }
}

export async function actualizarImagenProducto(productoId, imagenId, data) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedImagenId = parsePositiveId(imagenId, "imagen");

  await validateProducto(parsedProductoId);
  await getImagen(parsedProductoId, parsedImagenId);

  const imageData = pickUpdateImageData(data);
  const imagen = await actualizarImagenProductoAdmin(
    parsedProductoId,
    parsedImagenId,
    imageData
  );

  if (!imagen) {
    throw createHttpError("Imagen no encontrada", 404);
  }

  return imagen;
}

export async function marcarImagenProductoPrincipal(productoId, imagenId) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedImagenId = parsePositiveId(imagenId, "imagen");

  await validateProducto(parsedProductoId);
  await getImagen(parsedProductoId, parsedImagenId);

  const imagen = await marcarImagenProductoAdminPrincipal(
    parsedProductoId,
    parsedImagenId
  );

  if (!imagen) {
    throw createHttpError("Imagen no encontrada", 404);
  }

  return imagen;
}

export async function reemplazarImagenProducto(productoId, imagenId, file) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedImagenId = parsePositiveId(imagenId, "imagen");

  validarArchivoImagen(file);
  await validateProducto(parsedProductoId);

  const currentImage = await getImagen(parsedProductoId, parsedImagenId);
  const uploadData = await subirImagenProductoCloudinary(file, parsedProductoId);

  let imagen;

  try {
    imagen = await reemplazarImagenProductoAdmin(
      parsedProductoId,
      parsedImagenId,
      uploadData
    );
  } catch (error) {
    await limpiarImagenCloudinary(uploadData.public_id);
    throw error;
  }

  if (!imagen) {
    await limpiarImagenCloudinary(uploadData.public_id);
    throw createHttpError("Imagen no encontrada", 404);
  }

  await limpiarImagenCloudinary(currentImage.public_id);
  return imagen;
}

export async function eliminarImagenProducto(productoId, imagenId) {
  const parsedProductoId = parsePositiveId(productoId, "producto");
  const parsedImagenId = parsePositiveId(imagenId, "imagen");

  await validateProducto(parsedProductoId);

  const imagen = await eliminarImagenProductoAdmin(
    parsedProductoId,
    parsedImagenId
  );

  if (!imagen) {
    throw createHttpError("Imagen no encontrada", 404);
  }

  await limpiarImagenCloudinary(imagen.public_id);
  return imagen;
}
