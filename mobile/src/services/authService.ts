import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./apiConfig";
import { apiFetch, handleResponse, setAccessToken, restoreAccessToken, clearAccessToken, hasSession, onSessionEnded, requireSessionUser } from "./apiClient";
import type { UsuarioResponse } from "../types";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { cancelarTodosLembretesLocais } from "./notificacaoService";
const CURRENT_USER_KEY = "studymate_current_user";
const AUTH_SESSION_KEY = "studymate_auth_session";

type SessaoPersistida = {
  token: string;
  expiresAt: number;
  idUsuario: number;
};
type CadastroUsuarioPayload = { nome: string; email: string; senha: string };
type LoginUsuarioPayload = { email: string; senha: string };
type VerificarEmailPayload = { codigo: string; senha: string };
export type MensagemResponse = { mensagem: string };
type LoginResponse = UsuarioResponse & { token: string; tipo: string; expiresIn: number };

const perfilUsuario = (usuario: UsuarioResponse): UsuarioResponse => ({
  idUsuario: usuario.idUsuario,
  nome: usuario.nome,
  email: usuario.email,
  curso: usuario.curso ?? null,
  semestre: usuario.semestre ?? null,
  matricula: usuario.matricula ?? null,
  instituicao: usuario.instituicao ?? null,
  emailAlteracaoPendente: Boolean(usuario.emailAlteracaoPendente),
});

const secureStoreDisponivel = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }

  return SecureStore.isAvailableAsync();
};

const salvarSessaoSegura = async (
  sessao: SessaoPersistida
): Promise<void> => {
  if (!(await secureStoreDisponivel())) {
    return;
  }

  await SecureStore.setItemAsync(
    AUTH_SESSION_KEY,
    JSON.stringify(sessao)
  );
};

const removerSessaoSegura = async (): Promise<void> => {
  if (!(await secureStoreDisponivel())) {
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
};

const restaurarSessaoSegura = async (): Promise<boolean> => {
  if (!(await secureStoreDisponivel())) {
    return false;
  }

  const dados = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!dados) {
    return false;
  }

  try {
    const sessao = JSON.parse(dados) as SessaoPersistida;

    const restaurada = restoreAccessToken(
      sessao.token,
      sessao.expiresAt,
      sessao.idUsuario
    );

    if (!restaurada) {
      await removerSessaoSegura();
    }

    return restaurada;
  } catch {
    await removerSessaoSegura();
    return false;
  }
};

export const cadastrarUsuario = async (
  payload: CadastroUsuarioPayload
): Promise<MensagemResponse> => {
  const response = await apiFetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: payload.nome.trim(),
        email: payload.email.trim().toLowerCase(),
        senha: payload.senha,
      }),
    },
    false
  );

  return handleResponse<MensagemResponse>(response);
};

export const verificarEmail = async (
  payload: VerificarEmailPayload,
  autenticado = false
): Promise<MensagemResponse> => {
  const codigo = payload.codigo.trim();
  if (!/^[a-fA-F0-9]{64}$/.test(codigo) || !payload.senha) {
    throw new Error("Informe o código de 64 caracteres enviado por e-mail e sua senha.");
  }
  const response = await apiFetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, senha: payload.senha }),
  }, autenticado);
  return handleResponse<MensagemResponse>(response);
};

export const loginUsuario = async (payload: LoginUsuarioPayload): Promise<UsuarioResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: payload.email.trim().toLowerCase(), senha: payload.senha }),
  }, false);
  const data = await handleResponse<LoginResponse>(response);
  if (data.tipo !== "Bearer") throw new Error("Resposta de autenticação inválida.");
  await cancelarTodosLembretesLocais();

  const expiresAt = setAccessToken(
    data.token,
    data.expiresIn,
    data.idUsuario
  );

  try {
    await salvarSessaoSegura({
      token: data.token,
      expiresAt,
      idUsuario: data.idUsuario,
    });
  } catch {
    clearAccessToken();

    throw new Error(
      "Não foi possível armazenar a sessão com segurança. Tente entrar novamente."
    );
  }
  return perfilUsuario(data);
};

onSessionEnded(() => {
  void Promise.all([
    AsyncStorage.removeItem(CURRENT_USER_KEY),
    removerSessaoSegura(),
  ]);
});

export const salvarUsuarioSessao = async (usuario: UsuarioResponse): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(perfilUsuario(usuario)));
};

export const obterUsuarioSessao =
  async (): Promise<UsuarioResponse | null> => {
    if (!hasSession()) {
      const restaurada = await restaurarSessaoSegura();

      if (!restaurada) {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
        return null;
      }
    }

    const dados = await AsyncStorage.getItem(CURRENT_USER_KEY);

    if (!dados) {
      clearAccessToken();
      await removerSessaoSegura();
      return null;
    }

    try {
      const usuario = perfilUsuario(JSON.parse(dados));

      if (requireSessionUser() !== usuario.idUsuario) {
        clearAccessToken();
        await removerSessaoSegura();
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
        return null;
      }

      return usuario;
    } catch {
      clearAccessToken();
      await removerSessaoSegura();
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  };

export const encerrarSessao = async (): Promise<void> => {
  clearAccessToken();
  await removerSessaoSegura();
  await cancelarTodosLembretesLocais();
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
};
