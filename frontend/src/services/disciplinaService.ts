const obterIdUsuario = (): number => {
  let usuario: { idUsuario?: number } | null = null;
  try {
    usuario = JSON.parse(localStorage.getItem("studymate_current_user") || "null");
  } catch {
    throw new Error("Entre novamente na sua conta para acessar as disciplinas.");
  }
  if (!Number.isInteger(usuario?.idUsuario) || usuario!.idUsuario! <= 0) {
    throw new Error("Entre novamente na sua conta para acessar as disciplinas.");
  }
  return usuario!.idUsuario!;
};
const API_BASE_URL = "http://localhost:8081/api";

export type DisciplinaResponse = {
  idDisciplina: number;
  idPeriodo: number;
  nome: string;
  professor: string | null;
  mediaAprovacao: number;
  limiteFaltas: number;
};

export type DisciplinaRequest = {
  idPeriodo?: number;
  nome: string;
  professor: string;
  mediaAprovacao: number;
  limiteFaltas: number;
};

const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || "Erro ao processar a requisição.");
  }

  return data;
};

export const listarDisciplinas = async (
  termo?: string
): Promise<DisciplinaResponse[]> => {
  const params = new URLSearchParams({ idUsuario: String(obterIdUsuario()) });

  if (termo && termo.trim() !== "") {
    params.append("termo", termo);
  }

  const url = params.toString()
    ? `${API_BASE_URL}/disciplinas?${params.toString()}`
    : `${API_BASE_URL}/disciplinas`;

  const response = await fetch(url);

  return handleResponse(response);
};

export const cadastrarDisciplina = async (
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, idUsuario: obterIdUsuario() }),
  });

  return handleResponse(response);
};

export const excluirDisciplina = async (idDisciplina: number) => {
  const response = await fetch(`${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${obterIdUsuario()}`, {
    method: "DELETE",
  });

  return handleResponse(response);
};

export const buscarDisciplinaPorId = async (
  idDisciplina: number
): Promise<DisciplinaResponse> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${obterIdUsuario()}`);

  return handleResponse(response);
};

export const atualizarDisciplina = async (
  idDisciplina: number,
  payload: DisciplinaRequest
): Promise<DisciplinaResponse> => {
  const response = await fetch(`${API_BASE_URL}/disciplinas/${idDisciplina}?idUsuario=${obterIdUsuario()}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, idUsuario: obterIdUsuario() }),
  });

  return handleResponse(response);
};