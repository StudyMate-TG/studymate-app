import { useQuery } from "@tanstack/react-query";
import { getSessionGeneration, hasSession, requireSessionUser } from "../services/apiClient";
import { contarNotificacoesNaoLidas } from "../services/centralNotificacoesService";

export function useNotificacoesNaoLidas() {
  const usuario = hasSession() ? requireSessionUser() : null;
  return useQuery({
    queryKey: ["notificacoes", usuario, getSessionGeneration(), "total"],
    queryFn: contarNotificacoesNaoLidas,
    enabled: usuario !== null,
    retry: false,
    refetchInterval: 60000,
    staleTime: 0,
  });
}
