export function notFoundMiddleware(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorMiddleware(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;

  console.error("[error]", {
    statusCode,
    message: error.message,
    code: error.code,
  });

  const response = {
    ok: false,
    message: error.message || "Error interno del servidor",
  };

  if (statusCode === 429) {
    response.pagination = null;
  }

  res.status(statusCode).json(response);
}
