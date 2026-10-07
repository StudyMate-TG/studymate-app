// JWTs stay in memory. Restarting or reloading the app requires a new login.
let accessToken: string | null = null;
let expiresAt = 0;
const sessionListeners = new Set<() => void>();

export const onSessionEnded = (listener: () => void): (() => void) => {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
};

export const clearAccessToken = (): void => {
  accessToken = null;
  expiresAt = 0;
  sessionListeners.forEach((listener) => listener());
};

export const setAccessToken = (token: string, expiresIn: number): void => {
  if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Não foi possível iniciar a sessão. Entre novamente.");
  }
  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000;
};

export const hasSession = (): boolean => {
  if (accessToken && Date.now() >= expiresAt) clearAccessToken();
  return Boolean(accessToken);
};

export const apiFetch = async (
  url: string,
  init: RequestInit = {},
  authenticated = true
): Promise<Response> => {
  const headers = new Headers(init.headers);
  if (authenticated) {
    if (!hasSession()) {
      clearAccessToken();
      throw new Error("Sua sessão terminou. Entre novamente.");
    }
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    clearAccessToken();
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
