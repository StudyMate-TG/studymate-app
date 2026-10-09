// JWTs stay in memory. Restarting or reloading the app requires a new login.
let accessToken: string | null = null;
let expiresAt = 0;
let sessionUserId: number | null = null;
let sessionGeneration = 0;
const sessionListeners = new Set<() => void>();

export const onSessionEnded = (listener: () => void): (() => void) => {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
};

export const clearAccessToken = (): void => {
  sessionGeneration++;
  accessToken = null;
  expiresAt = 0;
  sessionUserId = null;
  sessionListeners.forEach((listener) => listener());
};

export const setAccessToken = (token: string, expiresIn: number, idUsuario: number): void => {
  if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0 || !Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new Error("Não foi possível iniciar a sessão. Entre novamente.");
  }
  sessionGeneration++;
  sessionUserId = idUsuario;
  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000;
};

export const hasSession = (): boolean => {
  if (accessToken && Date.now() >= expiresAt) clearAccessToken();
  return Boolean(accessToken);
};

export const requireSessionUser = (idUsuario?: number): number => {
  if (!hasSession() || sessionUserId === null) {
    throw new Error("Sua sessão terminou. Entre novamente.");
  }
  if (idUsuario !== undefined && idUsuario !== sessionUserId) {
    throw new Error("A sessão mudou. Abra novamente as tarefas da sua conta.");
  }
  return sessionUserId;
};

export const apiFetch = async (
  url: string,
  init: RequestInit = {},
  authenticated = true,
  expectedUserId?: number
): Promise<Response> => {
  const headers = new Headers(init.headers);
  const requestToken = accessToken;
  const requestGeneration = sessionGeneration;
  if (authenticated) {
    if (!hasSession()) {
      clearAccessToken();
      throw new Error("Sua sessão terminou. Entre novamente.");
    }
    if (expectedUserId !== undefined) requireSessionUser(expectedUserId);
    headers.set("Authorization", `Bearer ${requestToken}`);
  }
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    if (sessionGeneration === requestGeneration) clearAccessToken();
    throw new Error(authenticated
      ? "Sua sessão terminou. Entre novamente."
      : "Não foi possível entrar. Confira suas credenciais e a confirmação do e-mail.");
  }
  return response;
};

export const handleResponse = async <T>(response: Response): Promise<T> => {
  let data: { mensagem?: string } | null = null;
  try { data = await response.json(); } catch { /* Responses may have no JSON body. */ }
  if (!response.ok) {
    throw new Error(data?.mensagem || "Erro ao processar a requisição.");
  }
  return data as T;
};
