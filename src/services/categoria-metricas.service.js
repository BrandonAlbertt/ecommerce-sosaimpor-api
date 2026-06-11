import { obtenerCategoriaAdminPorId } from "../models/categorias.model.js";
import {
  actualizarCategoriaMetrica,
  asegurarCategoriaMetrica,
  eliminarCategoriaMetrica,
  incrementarVistasCategoriaMetrica,
  listarCategoriaMetricas,
  resetearCategoriaMetrica,
} from "../models/categoria-metricas.model.js";
import { registrarEventoMetricaSiPermitido } from "./metricas-eventos-control.service.js";

const metricFields = ["vistas"];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseCategoriaId(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError("id de categoria invalido");
  }

  return numericId;
}

async function validarCategoriaExistente(categoriaId) {
  const categoria = await obtenerCategoriaAdminPorId(categoriaId);

  if (!categoria) {
    throw createHttpError("Categoria no encontrada", 404);
  }

  return categoria;
}

function toMetricCounter(value, fieldName) {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw createHttpError(`${fieldName} debe ser un entero mayor o igual a 0`);
  }

  return numericValue;
}

function pickMetricData(data) {
  const sourceData = data && typeof data === "object" ? data : {};
  const metricData = {};

  for (const field of metricFields) {
    if (Object.prototype.hasOwnProperty.call(sourceData, field)) {
      metricData[field] = toMetricCounter(sourceData[field], field);
    }
  }

  return metricData;
}

async function asegurarMetricaDeCategoria(categoriaId) {
  await validarCategoriaExistente(categoriaId);
  return asegurarCategoriaMetrica(categoriaId);
}

export async function obtenerMetricasCategoriasAdmin() {
  return listarCategoriaMetricas();
}

export async function obtenerMetricaCategoriaAdmin(categoriaIdParam) {
  const categoriaId = parseCategoriaId(categoriaIdParam);
  return asegurarMetricaDeCategoria(categoriaId);
}

export async function actualizarMetricaCategoriaAdmin(categoriaIdParam, data) {
  const categoriaId = parseCategoriaId(categoriaIdParam);
  const metricData = pickMetricData(data);

  await asegurarMetricaDeCategoria(categoriaId);

  const metrica = await actualizarCategoriaMetrica(categoriaId, metricData);

  if (!metrica) {
    throw createHttpError("Metrica de categoria no encontrada", 404);
  }

  return metrica;
}

export async function resetearMetricaCategoriaAdmin(categoriaIdParam) {
  const categoriaId = parseCategoriaId(categoriaIdParam);

  await asegurarMetricaDeCategoria(categoriaId);

  const metrica = await resetearCategoriaMetrica(categoriaId);

  if (!metrica) {
    throw createHttpError("Metrica de categoria no encontrada", 404);
  }

  return metrica;
}

export async function eliminarMetricaCategoriaAdmin(categoriaIdParam) {
  const categoriaId = parseCategoriaId(categoriaIdParam);

  await validarCategoriaExistente(categoriaId);

  const metrica = await eliminarCategoriaMetrica(categoriaId);

  if (!metrica) {
    throw createHttpError("Metrica de categoria no encontrada", 404);
  }

  return metrica;
}

export async function registrarVistaCategoria(categoriaIdParam, requestInfo) {
  const categoriaId = parseCategoriaId(categoriaIdParam);
  await validarCategoriaExistente(categoriaId);

  const control = await registrarEventoMetricaSiPermitido({
    tipo: "categoria",
    referenciaId: categoriaId,
    requestInfo,
  });

  if (!control.debeContar) {
    const metrica = await asegurarCategoriaMetrica(categoriaId);
    return {
      contada: false,
      metrica,
    };
  }

  const metrica = await incrementarVistasCategoriaMetrica(categoriaId);

  return {
    contada: true,
    metrica,
  };
}
