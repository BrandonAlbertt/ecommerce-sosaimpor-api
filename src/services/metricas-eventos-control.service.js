import { createHmac } from "node:crypto";
import {
  crearEventoMetricaControlSiNoExisteReciente,
  eliminarEventosMetricasAntiguos,
} from "../models/metricas-eventos-control.model.js";

const DEFAULT_METRICS_VIEW_COOLDOWN_MINUTES = 30;
const METRICS_CONTROL_MAX_AGE_HOURS = 24;

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getMetricsHashSecret() {
  const secret = process.env.METRICS_HASH_SECRET;

  if (!secret) {
    throw createHttpError("Configuracion de metricas incompleta", 500);
  }

  return secret;
}

function hashValue(value) {
  return createHmac("sha256", getMetricsHashSecret())
    .update(String(value))
    .digest("hex");
}

function toPositiveIntegerOrDefault(value, fallback) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : fallback;
}

function getMetricsCooldownMinutes() {
  return toPositiveIntegerOrDefault(
    process.env.METRICS_VIEW_COOLDOWN_MINUTES,
    DEFAULT_METRICS_VIEW_COOLDOWN_MINUTES
  );
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

export function obtenerIpRealMetricas(req) {
  const headers = req.headers || {};

  return normalizeIp(
    getHeaderValue(headers, "cf-connecting-ip") ||
      getHeaderValue(headers, "x-real-ip") ||
      getHeaderValue(headers, "x-forwarded-for") ||
      req.ip ||
      req.socket?.remoteAddress
  );
}

export function obtenerUserAgentMetricas(req) {
  return getHeaderValue(req.headers || {}, "user-agent") || "unknown";
}

export async function registrarEventoMetricaSiPermitido({
  tipo,
  referenciaId,
  requestInfo,
}) {
  const ipHash = hashValue(requestInfo?.ip || "unknown");
  const userAgentHash = hashValue(requestInfo?.userAgent || "unknown");
  const cooldownMinutes = getMetricsCooldownMinutes();

  await eliminarEventosMetricasAntiguos(METRICS_CONTROL_MAX_AGE_HOURS);

  const evento = await crearEventoMetricaControlSiNoExisteReciente({
    tipo,
    referenciaId,
    ipHash,
    userAgentHash,
    cooldownMinutes,
  });

  if (!evento) {
    return {
      debeContar: false,
      cooldownMinutes,
    };
  }

  return {
    debeContar: true,
    cooldownMinutes,
  };
}
