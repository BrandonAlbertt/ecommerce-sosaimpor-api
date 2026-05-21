import { Readable } from "node:stream";
import { cloudinary } from "../config/cloudinary.js";

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validarConfiguracionCloudinary() {
  if (!process.env.CLOUDINARY_URL) {
    throw createHttpError(
      "Cloudinary no esta configurado: falta CLOUDINARY_URL en .env"
    );
  }
}

function subirBufferACloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
}

export async function subirImagenProductoCloudinary(file, productoId) {
  validarConfiguracionCloudinary();

  const result = await subirBufferACloudinary(file.buffer, {
    folder: `sosaimpor/productos/${productoId}`,
    resource_type: "image",
  });

  return {
    imagen_url: result.secure_url,
    public_id: result.public_id,
  };
}

export async function eliminarImagenCloudinary(publicId) {
  if (!publicId) {
    return null;
  }

  validarConfiguracionCloudinary();
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}
