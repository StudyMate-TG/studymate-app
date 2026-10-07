import { apiFetch, handleResponse } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

import type { UsuarioResponse } from "../types";

type UsuarioUpdateRequest = {
  nome: string;
  email: string;
  curso: string | null;
  matricula: string | null;
  instituicao: string | null;
};

export const atualizarUsuario = async (
  idUsuario: number,
  payload: UsuarioUpdateRequest
): Promise<UsuarioResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/usuarios/${idUsuario}`, {
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