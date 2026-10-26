import { apiFetch, getSessionGeneration, handleResponse, requireSessionUser } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export type NotificacaoResponse = {
  idNotificacao: number; titulo: string; mensagem: string; tipo: string; lida: boolean;
  criadoEm: string; previstoPara: string; processadoEm: string;
  idDisciplina: number | null; idTarefa: number | null; idAvaliacao: number | null;
  origemTipo: string; origemId: number | null;
};
export type PaginaNotificacoes = {
  content: NotificacaoResponse[]; page: number; size: number; totalElements: number; totalPages: number;
};
async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const usuario = requireSessionUser();
  const geracao = getSessionGeneration();
  const resposta = await apiFetch(`${API_BASE_URL}/notificacoes${url}`, init, true, usuario);
  const dados = await handleResponse<T>(resposta);
  requireSessionUser(usuario);
  if (getSessionGeneration() !== geracao) throw new Error("A sessão mudou. Abra novamente as notificações.");
  return dados;
}
export const listarNotificacoes = (page = 0, size = 20, lida?: boolean): Promise<PaginaNotificacoes> => {
  if (!Number.isInteger(page) || page < 0 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 50) {
    return Promise.reject(new Error("Paginação inválida."));
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (lida !== undefined) params.set("lida", String(lida));
  return requisitar(`?${params}`);
};
export const contarNotificacoesNaoLidas = (): Promise<{ total: number }> => requisitar("/nao-lidas/total");
export const marcarNotificacaoLida = (id: number): Promise<NotificacaoResponse> => {
  if (!Number.isSafeInteger(id) || id <= 0) return Promise.reject(new Error("Notificação inválida."));
  return requisitar(`/${id}/lida`, { method: "PATCH" });
};
