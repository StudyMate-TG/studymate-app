import { apiFetch, handleResponse } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";

export type TarefaRequest = {
  idUsuario: number;
  idDisciplina: number;
  titulo: string;
  tipo: string;
  descricao?: string;
  dataHoraInicio?: string | null;
  dataEntrega: string;
  prioridade: string;
};

export type TarefaResponse = {
  idTarefa: number;
  idUsuario: number;
  idDisciplina: number;
  titulo: string;
  tipo: string;
  descricao: string | null;
  dataHoraInicio: string | null;
  dataEntrega: string;
  dataConclusao: string | null;
  status: string;
  prioridade: string;
};

export const cadastrarTarefa = async (
  payload: TarefaRequest
): Promise<TarefaResponse> => {
  const body = {
    idUsuario: payload.idUsuario,
    idDisciplina: payload.idDisciplina,
    titulo: payload.titulo.trim(),
    tipo: payload.tipo,
    descricao: payload.descricao?.trim() || "",
    dataHoraInicio: payload.dataHoraInicio || null,
    dataEntrega: payload.dataEntrega,
    prioridade: payload.prioridade,
  };


  const response = await apiFetch(`${API_BASE_URL}/tarefas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<TarefaResponse>(response);
};

export type TarefaResumoResponse = Omit<TarefaResponse, "descricao">;
export type PaginaTarefas = { tarefas: TarefaResumoResponse[]; nextPage: number | null };

export const listarTarefas = async (
  idUsuario: number,
  page = 0,
  size = 50
): Promise<PaginaTarefas> => {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 50) {
    throw new Error("Página de tarefas inválida.");
  }
  const response = await apiFetch(
    `${API_BASE_URL}/tarefas?idUsuario=${idUsuario}&page=${page}&size=${size}`
  );
  const tarefas = await handleResponse<TarefaResumoResponse[]>(response);
  const header = response.headers.get("X-Next-Page");
  const nextPage = header !== null && /^\d+$/.test(header) && Number(header) === page + 1
    ? Number(header)
    : tarefas.length === size ? page + 1 : null;
  return { tarefas, nextPage };
};