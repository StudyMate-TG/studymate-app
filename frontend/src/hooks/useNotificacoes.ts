import { useQuery } from "@tanstack/react-query";
import { obterUsuarioSessao } from "@/services/authService";
import { getSessionVersion, hasSession } from "@/services/apiClient";
import { totalNaoLidas } from "@/services/notificacaoService";

// Each login has a new cache key, including when the same account signs in again.
export const chaveNotificacoes = () => [
  "notificacoes",
  obterUsuarioSessao()?.idUsuario ?? null,
  getSessionVersion(),
] as const;

export const useTotalNotificacoes = () => useQuery({
  queryKey: [...chaveNotificacoes(), "total"],
  queryFn: ({ signal }) => totalNaoLidas(signal),
  enabled: hasSession(),
  staleTime: 15_000,
  refetchInterval: 60_000,
  retry: false,
});
