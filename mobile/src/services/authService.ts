import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./apiConfig";
import { apiFetch, handleResponse, setAccessToken, clearAccessToken, hasSession, onSessionEnded } from "./apiClient";
import type { UsuarioResponse } from "../types";
const CURRENT_USER_KEY = "studymate_current_user";
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

export const cadastrarUsuario = async (payload: CadastroUsuarioPayload): Promise<MensagemResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: payload.nome.trim(), email: payload.email.trim().toLowerCase(), senha: payload.senha }),
  }, false);
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
  setAccessToken(data.token, data.expiresIn, data.idUsuario);
  return perfilUsuario(data);
};

onSessionEnded(() => { void AsyncStorage.removeItem(CURRENT_USER_KEY); });
export const salvarUsuarioSessao = async (usuario: UsuarioResponse): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(perfilUsuario(usuario)));
};
export const obterUsuarioSessao = async (): Promise<UsuarioResponse | null> => {
  if (!hasSession()) { await AsyncStorage.removeItem(CURRENT_USER_KEY); return null; }
  const dados = await AsyncStorage.getItem(CURRENT_USER_KEY);
  try { return dados ? perfilUsuario(JSON.parse(dados)) : null; }
  catch { await AsyncStorage.removeItem(CURRENT_USER_KEY); return null; }
};
export const encerrarSessao = async (): Promise<void> => {
  clearAccessToken();
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
};
