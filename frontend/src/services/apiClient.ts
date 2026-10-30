// JWTs stay in memory. Restarting or reloading the app requires a new login.
let accessToken: string | null = null;
let expiresAt = 0;
let sessionVersion = 0;
type SessionEndReason = "logout" | "expired";
const sessionListeners = new Set<(reason: SessionEndReason) => void>();

export const getSessionVersion = (): number => sessionVersion;

export const onSessionEnded = (listener: (reason: SessionEndReason) => void): (() => void) => {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
};

export const clearAccessToken = (reason: SessionEndReason = "logout"): void => {
  accessToken = null;
  expiresAt = 0;
  sessionVersion += 1;
  sessionListeners.forEach((listener) => listener(reason));
};

export const setAccessToken = (token: string, expiresIn: number): void => {
  if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Não foi possível iniciar a sessão. Entre novamente.");
  }
  sessionVersion += 1;
  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000;
};

export const hasSession = (): boolean => {
  if (accessToken && Date.now() >= expiresAt) clearAccessToken("expired");
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
      clearAccessToken("expired");
      throw new Error("Sua sessão terminou. Entre novamente.");
    }
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const requestSessionVersion = sessionVersion;
  const response = await fetch(url, { ...init, headers });
  // An old account's request must not populate the new session or end its login.
  if (authenticated && requestSessionVersion !== sessionVersion) {
    throw new Error("A sessão mudou. Tente novamente.");
  }
  if (response.status === 401) {
    if (authenticated) clearAccessToken("expired");
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
