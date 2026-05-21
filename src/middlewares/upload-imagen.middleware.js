import multer from "multer";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function aceptarSoloImagenes(_req, file, callback) {
  if (!file.mimetype.startsWith("image/")) {
    callback(createHttpError("El archivo debe ser una imagen"));
    return;
  }

  callback(null, true);
}

const multerImagen = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: aceptarSoloImagenes,
});

function manejarErrorMulter(error, _req, _res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      next(createHttpError("La imagen debe pesar 5 MB o menos"));
      return;
    }

    next(createHttpError(error.message));
    return;
  }

  next(error);
}

export const subirImagenProducto = [
  multerImagen.single("imagen"),
  manejarErrorMulter,
];
