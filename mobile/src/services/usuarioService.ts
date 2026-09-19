import { API_BASE_URL } from "./apiConfig";

import type { UsuarioResponse } from "../types";

type UsuarioUpdateRequest = {
  nome: string;
  email: string;
  curso: string | null;
  matricula: string | null;
  instituicao: string | null;
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

export const atualizarUsuario = async (
  idUsuario: number,
  payload: UsuarioUpdateRequest
): Promise<UsuarioResponse> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${idUsuario}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: payload.nome.trim(),
      email: payload.email.trim().toLowerCase(),
      curso: payload.curso,
      matricula: payload.matricula,
      instituicao: payload.instituicao,
    }),
  });

  return handleResponse<UsuarioResponse>(response);
};