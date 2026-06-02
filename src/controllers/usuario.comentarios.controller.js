import {
  crearComentario,
  obtenerIpRealComentario,
  obtenerUserAgentComentario,
} from "../services/comentario.service.js";
import { successResponse } from "../utils/response.js";

export async function crearComentarioUsuarioController(req, res, next) {
  try {
    const comentario = await crearComentario(req.body, {
      ip: obtenerIpRealComentario(req),
      userAgent: obtenerUserAgentComentario(req),
    });

    res.status(201).json(
      successResponse({
        message: "gracias por registrar tu comentario.",
        comentario,
      })
    );
  } catch (error) {
    next(error);
  }
}
