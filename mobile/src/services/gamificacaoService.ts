import { apiFetch, handleResponse, requireSessionUser } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export type MedalhaResponse = {
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: string;
  meta: number;
  progresso: number;
  desbloqueada: boolean;
  desbloqueadaEm: string | null;
};

export type GamificacaoResponse = {
  xpTotal: number;
  nivel: number;
  xpNoNivel: number;
  xpParaProximoNivel: number;
  ofensivaAtual: number;
  melhorOfensiva: number;
  ativoHoje: boolean;
  xpHoje: number;
  metaDiaria: number;
  tarefasConcluidas: number;
  presencasRegistradas: number;
  diasAtivos: number;
  semana: Array<{ data: string; ativo: boolean; xp: number }>;
  medalhas: MedalhaResponse[];
  atividadesRecentes: Array<{
    id: string;
    tipo: string;
    descricao: string;
    xp: number;
    data: string;
    dataAtividade: string;
  }>;
};

// Only successful server mutations / offline Push+Pull notify this channel.
const progressoListeners = new Set<(idUsuario: number, antes?: GamificacaoResponse | null) => void>();
const snapshotListeners = new Set<(idUsuario: number, progresso: GamificacaoResponse) => void>();

export const onProgressoAtualizado = (listener: (idUsuario: number, antes?: GamificacaoResponse | null) => void) => {
  progressoListeners.add(listener);
  return () => { progressoListeners.delete(listener); };
};

export const notificarProgressoAtualizado = (idUsuario: number, antes?: GamificacaoResponse | null) => {
  progressoListeners.forEach((listener) => listener(idUsuario, antes));
};

export const onGamificacaoCarregada = (listener: (idUsuario: number, progresso: GamificacaoResponse) => void) => {
  snapshotListeners.add(listener);
  return () => { snapshotListeners.delete(listener); };
};

export const obterGamificacao = async (idUsuario: number, signal?: AbortSignal): Promise<GamificacaoResponse> => {
  requireSessionUser(idUsuario);
  const response = await apiFetch(`${API_BASE_URL}/gamificacao`, { signal }, true, idUsuario);
  const progresso = await handleResponse<GamificacaoResponse>(response);
  requireSessionUser(idUsuario);
  snapshotListeners.forEach((listener) => listener(idUsuario, progresso));
  return progresso;
};

// A missing connection must keep task/offline mutations available.
export const capturarProgressoAntesAtividade = async (idUsuario: number): Promise<GamificacaoResponse | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try { return await obterGamificacao(idUsuario, controller.signal); }
  catch { requireSessionUser(idUsuario); return null; }
  finally { clearTimeout(timer); }
};
