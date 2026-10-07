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
  nomeDisciplina: string;
  titulo: string;
  tipo: string;
  descricao: string | null;
  dataHoraInicio: string | null;
  dataEntrega: string;
  dataConclusao: string | null;
  status: string;
  prioridade: string;
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

  console.log("Body enviado para API de tarefas:", body);

  const response = await fetch(`${API_BASE_URL}/tarefas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse<TarefaResponse>(response);
};

export const listarTarefas = async (
  idUsuario: number
): Promise<TarefaResponse[]> => {
  const response = await fetch(
    `${API_BASE_URL}/tarefas?idUsuario=${idUsuario}`
  );

  return handleResponse<TarefaResponse[]>(response);
};

export const buscarTarefaPorId = async (
  idTarefa: number,
  idUsuario: number
): Promise<TarefaResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/tarefas/${idTarefa}?idUsuario=${idUsuario}`
  );

  return handleResponse<TarefaResponse>(response);
};

export const atualizarTarefa = async (
  idTarefa: number,
  idUsuario: number,
  payload: TarefaRequest
): Promise<TarefaResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/tarefas/${idTarefa}?idUsuario=${idUsuario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse<TarefaResponse>(response);
};
export const excluirTarefa = async (
  idTarefa: number,
  idUsuario: number
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/tarefas/${idTarefa}?idUsuario=${idUsuario}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const text = await response.text();

    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    throw new Error(
      data.mensagem ||
        data.message ||
        text ||
        "Erro ao excluir tarefa."
    );
  }
};