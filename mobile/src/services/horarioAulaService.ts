import {
  apiFetch,
  handleResponse,
} from "./apiClient";

import { API_BASE_URL } from "./apiConfig";

import type {
  HorarioAulaRequest,
  HorarioAulaResponse,
} from "../types";

type MensagemResponse = {
  mensagem: string;
};

export const listarHorariosAula = async (
  idDisciplina?: number
): Promise<HorarioAulaResponse[]> => {
  const url =
    idDisciplina !== undefined
      ? `${API_BASE_URL}/horarios-aula?idDisciplina=${idDisciplina}`
      : `${API_BASE_URL}/horarios-aula`;

  const response = await apiFetch(url);

  return handleResponse<HorarioAulaResponse[]>(
    response
  );
};

export const buscarHorarioAulaPorId = async (
  idHorario: number
): Promise<HorarioAulaResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/horarios-aula/${idHorario}`
  );

  return handleResponse<HorarioAulaResponse>(
    response
  );
};

export const cadastrarHorarioAula = async (
  payload: HorarioAulaRequest
): Promise<HorarioAulaResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/horarios-aula`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idDisciplina: payload.idDisciplina,
        diaSemana: payload.diaSemana.trim(),
        horaInicio: payload.horaInicio.trim(),
        horaFim: payload.horaFim.trim(),
        local: payload.local?.trim() || null,
      }),
    }
  );

  return handleResponse<HorarioAulaResponse>(
    response
  );
};

export const atualizarHorarioAula = async (
  idHorario: number,
  payload: HorarioAulaRequest
): Promise<HorarioAulaResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/horarios-aula/${idHorario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idDisciplina: payload.idDisciplina,
        diaSemana: payload.diaSemana.trim(),
        horaInicio: payload.horaInicio.trim(),
        horaFim: payload.horaFim.trim(),
        local: payload.local?.trim() || null,
      }),
    }
  );

  return handleResponse<HorarioAulaResponse>(
    response
  );
};

export const excluirHorarioAula = async (
  idHorario: number
): Promise<MensagemResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/horarios-aula/${idHorario}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<MensagemResponse>(
    response
  );
};