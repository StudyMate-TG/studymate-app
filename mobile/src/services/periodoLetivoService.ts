import { apiFetch, handleResponse } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

import type {
  PeriodoLetivoRequest,
  PeriodoLetivoResponse,
} from "../types";

type MensagemResponse = {
  mensagem: string;
};

export const listarPeriodosLetivos = async (
  idUsuario: number
): Promise<PeriodoLetivoResponse[]> => {
  const response = await apiFetch(
    `${API_BASE_URL}/periodos?idUsuario=${idUsuario}`
  );

  return handleResponse<PeriodoLetivoResponse[]>(response);
};

export const consultarPeriodoLetivoAtivo = async (
  idUsuario: number
): Promise<PeriodoLetivoResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/periodos/ativo?idUsuario=${idUsuario}`
  );

  return handleResponse<PeriodoLetivoResponse>(response);
};

export const cadastrarPeriodoLetivo = async (
  payload: PeriodoLetivoRequest
): Promise<PeriodoLetivoResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/periodos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idUsuario: payload.idUsuario,
      nome: payload.nome.trim(),
      dataInicio: payload.dataInicio,
      dataFim: payload.dataFim,
      status: payload.status,
    }),
  });

  return handleResponse<PeriodoLetivoResponse>(response);
};

export const ativarPeriodoLetivo = async (
  idPeriodo: number,
  idUsuario: number
): Promise<PeriodoLetivoResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/periodos/${idPeriodo}/ativar?idUsuario=${idUsuario}`,
    {
      method: "PUT",
    }
  );

  return handleResponse<PeriodoLetivoResponse>(response);
};

export const excluirPeriodoLetivo = async (
  idPeriodo: number,
  idUsuario: number
): Promise<MensagemResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/periodos/${idPeriodo}?idUsuario=${idUsuario}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<MensagemResponse>(response);
};