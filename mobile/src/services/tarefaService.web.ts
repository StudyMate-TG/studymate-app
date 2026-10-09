import { apiFetch, handleResponse, requireSessionUser } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";
import type { TarefaReferencia, TarefaRequest, TarefaResponse } from "./tarefaTypes";

export type { TarefaReferencia, TarefaRequest, TarefaResponse } from "./tarefaTypes";

const normalizarPayload = (payload: TarefaRequest): TarefaRequest => ({
  ...payload,
  titulo: payload.titulo.trim(),
  tipo: payload.tipo.trim(),
  descricao: payload.descricao?.trim() || "",
  dataHoraInicio: payload.dataHoraInicio ?? null,
  prioridade: payload.prioridade.trim(),
});

const idNoServidor = (referencia: TarefaReferencia): number => {
  if (!Number.isInteger(referencia.idTarefa) || (referencia.idTarefa ?? 0) <= 0) {
    throw new Error("Tarefa não encontrada no servidor.");
  }
  return referencia.idTarefa!;
};

export async function cadastrarTarefa(payload: TarefaRequest): Promise<TarefaResponse> {
  const response = await apiFetch(`${API_BASE_URL}/tarefas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizarPayload(payload)),
  }, true, payload.idUsuario);
  return handleResponse<TarefaResponse>(response);
}

// Mantém o contrato de lista usado pela agenda e pela cópia offline.
// Cada requisição online continua limitada a 50 resumos, sem carregar os CLOBs.
export async function listarTarefas(idUsuario: number): Promise<TarefaResponse[]> {
  requireSessionUser(idUsuario);
  const tarefas: TarefaResponse[] = [];
  for (let page = 0; page <= 10000; page++) {
    const response = await apiFetch(`${API_BASE_URL}/tarefas?page=${page}&size=50`, {}, true, idUsuario);
    const resumo = await handleResponse<Omit<TarefaResponse, "descricao">[]>(response);
    tarefas.push(...resumo.map((tarefa) => ({ ...tarefa, descricao: null })));
    const next = response.headers.get("X-Next-Page");
    if (next === null) return tarefas;
    if (!/^\d+$/.test(next) || Number(next) !== page + 1) {
      throw new Error("Paginação de tarefas inválida.");
    }
  }
  throw new Error("Limite de páginas de tarefas excedido.");
}

export async function buscarTarefaPorId(referencia: TarefaReferencia, idUsuario: number): Promise<TarefaResponse> {
  const response = await apiFetch(`${API_BASE_URL}/tarefas/${idNoServidor(referencia)}`, {}, true, idUsuario);
  return handleResponse<TarefaResponse>(response);
}

export async function atualizarTarefa(referencia: TarefaReferencia, idUsuario: number, payload: TarefaRequest): Promise<TarefaResponse> {
  if (payload.idUsuario !== idUsuario) throw new Error("Usuário da tarefa inválido.");
  const response = await apiFetch(`${API_BASE_URL}/tarefas/${idNoServidor(referencia)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizarPayload(payload)),
  }, true, idUsuario);
  return handleResponse<TarefaResponse>(response);
}

export async function excluirTarefa(referencia: TarefaReferencia, idUsuario: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/tarefas/${idNoServidor(referencia)}`, {
    method: "DELETE",
  }, true, idUsuario);
  await handleResponse<{ mensagem: string }>(response);
}
