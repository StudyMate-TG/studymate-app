import { API_BASE_URL } from "./apiConfig";

import type { DisciplinaRequest, DisciplinaResponse } from "../types";

type MensagemResponse = {
  mensagem: string;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.mensagem ||
        data.message ||
        data.error ||
        text ||
        "Erro ao processar a requisição."
    );
  }

  return data as T;
};

export const listarDisciplinas = async (
  idUsuario: number,
  termo?: string
): Promise<DisciplinaResponse[]> => {
  const params = new URLSearchParams();

  params.append("idUsuario", String(idUsuario));

  const termoTratado = termo?.trim();

  if (termoTratado) {
    params.append("termo", termoTratado);
  }

  const response = await fetch(
    `${API_BASE_URL}/disciplinas?${params.toString()}`
  );

  return handleResponse<DisciplinaResponse[]>(response);
};

export const cadastrarDisciplina = async (
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  console.log("Payload recebido no service:", payload);

  const body = {
    idUsuario: payload.idUsuario,
    idPeriodo: payload.idPeriodo,
    nome: payload.nome.trim(),
    professor: payload.professor.trim(),
    mediaAprovacao: payload.mediaAprovacao,
    limiteFaltas: payload.limiteFaltas,
  };

  console.log("Body enviado para API:", body);

  const response = await fetch(`${API_BASE_URL}/disciplinas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<DisciplinaResponse>(response);
};

export const buscarDisciplinaPorId = async (
  idDisciplina: number,
  idUsuario: number
): Promise<DisciplinaResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${idUsuario}`
  );

  return handleResponse<DisciplinaResponse>(response);
};

export const atualizarDisciplina = async (
  idDisciplina: number,
  idUsuario: number,
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${idUsuario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idUsuario: payload.idUsuario,
        idPeriodo: payload.idPeriodo,
        nome: payload.nome.trim(),
        professor: payload.professor.trim(),
        mediaAprovacao: payload.mediaAprovacao,
        limiteFaltas: payload.limiteFaltas,
      }),
    }
  );

  return handleResponse<DisciplinaResponse>(response);
};

export const excluirDisciplina = async (
  idDisciplina: number,
  idUsuario: number
): Promise<MensagemResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${idUsuario}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<MensagemResponse>(response);
};