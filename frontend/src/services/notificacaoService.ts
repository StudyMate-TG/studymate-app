import { apiFetch, handleResponse } from "./apiClient";

const API_BASE_URL = "http://localhost:8081/api/notificacoes";

export type Notificacao = {
  idNotificacao: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadoEm: string;
  previstoPara: string;
  processadoEm: string;
  idDisciplina: number | null;
  idTarefa: number | null;
  idAvaliacao: number | null;
  origemTipo: string;
  origemId: number | null;
};

export type PaginaNotificacoes = {
  content: Notificacao[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export const listarNotificacoes = async (
  page = 0,
  lida?: boolean,
  signal?: AbortSignal
): Promise<PaginaNotificacoes> => {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (lida !== undefined) params.set("lida", String(lida));
  return handleResponse(await apiFetch(`${API_BASE_URL}?${params}`, { signal }));
};

export const totalNaoLidas = async (signal?: AbortSignal): Promise<number> => {
  const data = await handleResponse<{ total: number }>(
    await apiFetch(`${API_BASE_URL}/nao-lidas/total`, { signal })
  );
  return data.total;
};

export const marcarNotificacaoLida = async (id: number): Promise<Notificacao> =>
  handleResponse(await apiFetch(`${API_BASE_URL}/${id}/lida`, { method: "PATCH" }));
