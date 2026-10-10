import { apiFetch, handleResponse, setAccessToken, clearAccessToken, hasSession, onSessionEnded } from "./apiClient";
const API_BASE_URL = "http://localhost:8081/api";
const CURRENT_USER_KEY = "studymate_current_user";
export type UsuarioResponse = {
  idUsuario: number;
  nome: string;
  email: string;
  curso: string | null;
  semestre: string | null;
  matricula: string | null;
  instituicao: string | null;
  emailAlteracaoPendente?: boolean;
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
  setAccessToken(data.token, data.expiresIn);
  return perfilUsuario(data);
};

// Discard legacy persisted sessions, which may contain authentication fields.
localStorage.removeItem(CURRENT_USER_KEY);
onSessionEnded(() => localStorage.removeItem(CURRENT_USER_KEY));
export const salvarUsuarioSessao = (usuario: UsuarioResponse): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(perfilUsuario(usuario)));
};
export const obterUsuarioSessao = (): UsuarioResponse | null => {
  if (!hasSession()) { localStorage.removeItem(CURRENT_USER_KEY); return null; }
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? perfilUsuario(JSON.parse(data)) : null;
  } catch { localStorage.removeItem(CURRENT_USER_KEY); return null; }
};
export const encerrarSessao = (): void => { clearAccessToken(); };
