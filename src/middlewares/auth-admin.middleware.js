export const authAdminMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    console.error("ERROR: ADMIN_API_KEY no está configurada en el archivo .env");
    return res.status(500).json({
      error: "Error del servidor",
      mensaje: "Falta configurar la clave de administrador en el backend",
    });
  }

  if (!apiKey || apiKey !== adminApiKey) {
    return res.status(401).json({
      error: "Acceso denegado",
      mensaje: "API Key de administrador inválida o ausente",
    });
  }

  next();
};