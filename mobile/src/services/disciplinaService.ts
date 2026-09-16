import { API_BASE_URL } from "./apiConfig";
import type { DisciplinaRequest, DisciplinaResponse } from "../types";

const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || "Erro ao processar a requisição.");
  }

  return data;
};

export const listarDisciplinas = async (
  termo?: string
): Promise<DisciplinaResponse[]> => {
  const params = new URLSearchParams();

  if (termo && termo.trim() !== "") {
    params.append("termo", termo);
  }

  const url = params.toString()
    ? `${API_BASE_URL}/disciplinas?${params.toString()}`
    : `${API_BASE_URL}/disciplinas`;

  const response = await fetch(url);

  return handleResponse(response);
};

export const cadastrarDisciplina = async (
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const excluirDisciplina = async (idDisciplina: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas/${idDisciplina}`, {
    method: "DELETE",
  });

  return handleResponse(response);
};

export const buscarDisciplinaPorId = async (
  idDisciplina: number
): Promise<DisciplinaResponse> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas/${idDisciplina}`);

  return handleResponse(response);
};

export const atualizarDisciplina = async (
  idDisciplina: number,
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas/${idDisciplina}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};
