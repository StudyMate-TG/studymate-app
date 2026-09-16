import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./apiConfig";
import type { UsuarioResponse } from "../types";

const CURRENT_USER_KEY = "studymate_current_user";

type CadastroUsuarioPayload = {
  nome: string;
  email: string;
  senha: string;
};

type LoginUsuarioPayload = {
  email: string;
  senha: string;
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

export const salvarUsuarioSessao = async (usuario: UsuarioResponse): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(usuario));
};

export const obterUsuarioSessao = async (): Promise<UsuarioResponse | null> => {
  const dados = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return dados ? JSON.parse(dados) : null;
};

export const encerrarSessao = async (): Promise<void> => {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
};
