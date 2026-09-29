import { API_BASE_URL } from "./apiConfig";

export type FaltaRequest = {
  idDisciplina: number;
  dataFalta: string;
  quantidadeAulas: number;
};

export type FaltaResponse = {
  idFalta: number;
  idDisciplina: number;
  dataFalta: string;
  quantidadeAulas: number;
};

type MensagemResponse = {
  mensagem: string;
};

type TotalFaltasResponse = {
  total: number;
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

export const listarFaltas = async (
  idDisciplina: number,
  idUsuario: number
): Promise<FaltaResponse[]> => {
  const params = new URLSearchParams();

  params.append("idDisciplina", String(idDisciplina));
  params.append("idUsuario", String(idUsuario));

  const response = await fetch(
    `${API_BASE_URL}/faltas?${params.toString()}`
  );

  return handleResponse<FaltaResponse[]>(response);
};

export const cadastrarFalta = async (
  idUsuario: number,
  payload: FaltaRequest
): Promise<FaltaResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/faltas?idUsuario=${idUsuario}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idDisciplina: payload.idDisciplina,
        dataFalta: payload.dataFalta,
        quantidadeAulas: payload.quantidadeAulas,
      }),
    }
  );

  return handleResponse<FaltaResponse>(response);
};

export const atualizarFalta = async (
  idFalta: number,
  idUsuario: number,
  payload: FaltaRequest
): Promise<FaltaResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/faltas/${idFalta}?idUsuario=${idUsuario}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idDisciplina: payload.idDisciplina,
        dataFalta: payload.dataFalta,
        quantidadeAulas: payload.quantidadeAulas,
      }),
    }
  );

  return handleResponse<FaltaResponse>(response);
};

export const excluirFalta = async (
  idFalta: number,
  idUsuario: number
): Promise<MensagemResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/faltas/${idFalta}?idUsuario=${idUsuario}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<MensagemResponse>(response);
};

export const buscarTotalFaltas = async (
  idDisciplina: number,
  idUsuario: number
): Promise<number> => {
  const params = new URLSearchParams();

  params.append("idDisciplina", String(idDisciplina));
  params.append("idUsuario", String(idUsuario));

  const response = await fetch(
    `${API_BASE_URL}/faltas/total?${params.toString()}`
  );

  const data = await handleResponse<TotalFaltasResponse>(response);

  return data.total;
};