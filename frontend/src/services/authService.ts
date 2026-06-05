const API_BASE_URL = "http://localhost:8081/api";

type CadastroUsuarioPayload = {
  nome: string;
  email: string;
  senha: string;
};

type LoginUsuarioPayload = {
  email: string;
  senha: string;
};

export type UsuarioResponse = {
  idUsuario: number;
  nome: string;
  email: string;
  curso: string | null;
  semestre: string | null;
  matricula: string | null;
  instituicao: string | null;
};

const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || "Erro ao processar a requisição.");
  }

  return data;
};

export const cadastrarUsuario = async (
  payload: CadastroUsuarioPayload
): Promise<UsuarioResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const loginUsuario = async (
  payload: LoginUsuarioPayload
): Promise<UsuarioResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};