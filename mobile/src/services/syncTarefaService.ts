import { API_BASE_URL } from "./apiConfig";
import { apiFetch, handleResponse, requireSessionUser } from "./apiClient";
import type { TarefaResponse } from "./tarefaTypes";
import { buscarMetadata } from "../database/repositories/syncMetadataRepository";
import { aplicarPullTarefas } from "../database/repositories/tarefaSyncRepository";

type SyncTarefaPullResponse = {
  tarefas: TarefaResponse[];
  cursor: string;
  hasMore: boolean;
};

export async function executarPullTarefas(idUsuario: number): Promise<void> {
  requireSessionUser(idUsuario);
  let cursor = await buscarMetadata(`tarefas_cursor_${idUsuario}`, idUsuario);
  let hasMore: boolean;
  do {
    const parametros = new URLSearchParams();
    if (cursor) parametros.set("cursor", cursor);
    const response = await apiFetch(`${API_BASE_URL}/sync/tarefas?${parametros.toString()}`, {}, true, idUsuario);
    const dados = await handleResponse<SyncTarefaPullResponse>(response);
    requireSessionUser(idUsuario);
    if (dados.hasMore && (!dados.cursor || dados.cursor === cursor)) {
      throw new Error("O cursor de sincronização não avançou.");
    }
    await aplicarPullTarefas(dados.tarefas, idUsuario, dados.cursor);
    cursor = dados.cursor;
    hasMore = dados.hasMore === true;
  } while (hasMore);
}
