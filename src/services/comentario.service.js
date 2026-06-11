import { createHmac } from "node:crypto";
import {
  actualizarComentarioPagina,
  contarComentariosRecientesPorIpHash,
  crearComentarioPagina,
  eliminarComentarioPagina,
  listarComentariosPagina,
  obtenerComentarioPaginaPorId,
  vaciarComentariosPagina,
} from "../models/comentario.model.js";
import { obtenerConfiguracionTiendaActivaCompleta } from "../models/configuracion.model.js";
import { getPagination } from "../utils/pagination.js";

const SPAM_MESSAGE =
  "Ya recibimos tu sugerencia. Podr\u00e1s enviar otra m\u00e1s adelante.";
const DEFAULT_COMMENT_MIN_INTERVAL_MINUTES = 5;
const DEFAULT_COMMENT_DAILY_LIMIT = 3;

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getCommentHashSecret() {
  const secret = process.env.COMMENT_HASH_SECRET;

  if (!secret) {
    throw createHttpError("Configuracion de comentarios incompleta", 500);
  }

  return secret;
}

function hashValue(value) {
  return createHmac("sha256", getCommentHashSecret())
    .update(String(value))
    .digest("hex");
}

function toPositiveIntegerOrDefault(value, fallback) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
}

function parseComentarioId(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError("id de comentario invalido");
  }

  return numericId;
}

function getHeaderValue(headers, name) {
  const value = headers?.[name];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function normalizeIp(ip) {
  if (!ip) return "unknown";

  return String(ip)
    .split(",")[0]
    .trim()
    .replace(/^::ffff:/, "");
}

export function obtenerIpRealComentario(req) {
  const headers = req.headers || {};

  return normalizeIp(
    getHeaderValue(headers, "cf-connecting-ip") ||
      getHeaderValue(headers, "x-real-ip") ||
      getHeaderValue(headers, "x-forwarded-for") ||
      req.ip ||
      req.socket?.remoteAddress
  );
}

export function obtenerUserAgentComentario(req) {
  return getHeaderValue(req.headers || {}, "user-agent") || "unknown";
}

function normalizeTexto(value) {
  if (typeof value !== "string") {
    throw createHttpError("texto es obligatorio");
  }

  const texto = value.trim();

  if (!texto) {
    throw createHttpError("texto es obligatorio");
  }

  return texto;
}

function pickComentarioData(data) {
  const sourceData = data && typeof data === "object" ? data : {};

  if (!Object.prototype.hasOwnProperty.call(sourceData, "texto")) {
    throw createHttpError("texto es obligatorio");
  }

  return {
    texto: normalizeTexto(sourceData.texto),
  };
}

async function obtenerConfiguracionLimitesComentario() {
  const configuracion = await obtenerConfiguracionTiendaActivaCompleta();

  return {
    minIntervalMinutes: toPositiveIntegerOrDefault(
      configuracion?.comment_min_interval_minutes,
      DEFAULT_COMMENT_MIN_INTERVAL_MINUTES
    ),
    dailyLimit: toPositiveIntegerOrDefault(
      configuracion?.comment_daily_limit,
      DEFAULT_COMMENT_DAILY_LIMIT
    ),
  };
}

async function validarLimitesComentario(ipHash) {
  const config = await obtenerConfiguracionLimitesComentario();
  const limites = await contarComentariosRecientesPorIpHash(
    ipHash,
    config.minIntervalMinutes
  );

  if (
    limites.ultimosIntervalo >= 1 ||
    limites.ultimas24Horas >= config.dailyLimit
  ) {
    throw createHttpError(SPAM_MESSAGE, 429);
  }
}

export async function obtenerComentariosAdmin(query = {}) {
  const pagination = getPagination(query);
  const { comentarios, total } = await listarComentariosPagina(pagination);
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data: comentarios,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };
}

export async function obtenerComentarioAdmin(id) {
  const comentarioId = parseComentarioId(id);
  const comentario = await obtenerComentarioPaginaPorId(comentarioId);

  if (!comentario) {
    throw createHttpError("Comentario no encontrado", 404);
  }

  return comentario;
}

export async function crearComentario(data, requestInfo) {
  const comentarioData = pickComentarioData(data);
  const ipHash = hashValue(requestInfo?.ip || "unknown");
  const userAgentHash = hashValue(requestInfo?.userAgent || "unknown");

  await validarLimitesComentario(ipHash);

  comentarioData.ip_hash = ipHash;
  comentarioData.user_agent_hash = userAgentHash;

  return crearComentarioPagina(comentarioData);
}

export async function actualizarComentarioAdmin(id, data) {
  const comentarioId = parseComentarioId(id);
  const comentarioData = pickComentarioData(data);
  const comentario = await actualizarComentarioPagina(
    comentarioId,
    comentarioData
  );

  if (!comentario) {
    throw createHttpError("Comentario no encontrado", 404);
  }

  return comentario;
}

export async function eliminarComentarioAdmin(id) {
  const comentarioId = parseComentarioId(id);
  const comentario = await eliminarComentarioPagina(comentarioId);

  if (!comentario) {
    throw createHttpError("Comentario no encontrado", 404);
  }

  return comentario;
}

export async function vaciarComentariosAdmin() {
  return vaciarComentariosPagina();
}
