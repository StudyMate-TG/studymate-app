import { apiFetch, handleResponse } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export type AvaliacaoRequest = {
  idDisciplina: number;
  nome: string;
  tipo: string;
  nota: number | null;
  peso: number;
  dataAvaliacao: string;
};

export type AvaliacaoResponse = {
  idAvaliacao: number;
  idDisciplina: number;
  nome: string;
  tipo: string;
  nota: number | null;
  peso: number;
  dataAvaliacao: string;
};

export type MediaDisciplinaResponse = {
  media: number | null;
  avaliacoesComNota: number;
  avaliacoesPendentes: number;
};

export const listarAvaliacoes = async (
  idUsuario: number,
  idDisciplina: number
): Promise<AvaliacaoResponse[]> => {
  const params = new URLSearchParams({
    idUsuario: idUsuario.toString(),
    idDisciplina: idDisciplina.toString(),
  });

  const response = await apiFetch(
    `${API_BASE_URL}/avaliacoes?${params.toString()}`
  );

  return handleResponse<AvaliacaoResponse[]>(
    response
  );
};

export const buscarAvaliacaoPorId = async (
  idAvaliacao: number,
  idUsuario: number
): Promise<AvaliacaoResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/avaliacoes/${idAvaliacao}?idUsuario=${idUsuario}`
  );

  return handleResponse<AvaliacaoResponse>(
    response
  );
};

export const cadastrarAvaliacao = async (
  idUsuario: number,
  payload: AvaliacaoRequest
): Promise<AvaliacaoResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/avaliacoes?idUsuario=${idUsuario}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse<AvaliacaoResponse>(
    response
  );
};

export const atualizarAvaliacao = async (
  idAvaliacao: number,
  idUsuario: number,
  payload: AvaliacaoRequest
): Promise<AvaliacaoResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/avaliacoes/${idAvaliacao}?idUsuario=${idUsuario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse<AvaliacaoResponse>(
    response
  );
};

export const excluirAvaliacao = async (
  idAvaliacao: number,
  idUsuario: number
): Promise<void> => {
  const response = await apiFetch(
    `${API_BASE_URL}/avaliacoes/${idAvaliacao}?idUsuario=${idUsuario}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    let mensagem =
      "Erro ao excluir avaliação.";

    try {
      const data = await response.json();

      if (data?.mensagem) {
        mensagem = data.mensagem;
      }
    } catch {
      // mantém mensagem padrão
    }

    throw new Error(mensagem);
  }
};

export const buscarMediaDisciplina = async (
  idUsuario: number,
  idDisciplina: number
): Promise<MediaDisciplinaResponse> => {
  const params = new URLSearchParams({
    idUsuario: idUsuario.toString(),
    idDisciplina: idDisciplina.toString(),
  });

  const response = await apiFetch(
    `${API_BASE_URL}/avaliacoes/media?${params.toString()}`
  );

  return handleResponse<MediaDisciplinaResponse>(
    response
  );
};