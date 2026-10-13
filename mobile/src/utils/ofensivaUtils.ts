import type { GamificacaoResponse } from "../services/gamificacaoService";

export type OfensivaAcesa = { data: string; dias: number; xpNovo: number };

export const detectarOfensivaAcesa = (
  antes: GamificacaoResponse | null,
  depois: GamificacaoResponse
): OfensivaAcesa | null => {
  const hoje = depois.semana[depois.semana.length - 1];
  const diaAnterior = antes?.semana[antes.semana.length - 1]?.data;
  if (!antes || !depois.ativoHoje || !hoje?.ativo || !diaAnterior ||
      diaAnterior > hoje.data || (diaAnterior === hoje.data && antes.ativoHoje) ||
      depois.xpTotal <= antes.xpTotal) return null;
  return { data: hoje.data, dias: depois.ofensivaAtual, xpNovo: depois.xpTotal - antes.xpTotal };
};

type CelebrationStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};

export const reservarComemoracao = async (
  chave: string,
  reservadas: Set<string>,
  storage: CelebrationStorage,
  podeContinuar: () => boolean
): Promise<boolean> => {
  if (reservadas.has(chave)) return false;
  // Reserve before awaiting storage so simultaneous confirmations never repeat.
  reservadas.add(chave);
  try { if (await storage.getItem(chave)) return false; }
  catch { /* In-memory dedup still applies if device storage is unavailable. */ }
  if (!podeContinuar()) return false;
  try { await storage.setItem(chave, "1"); }
  catch { /* Keep the valid celebration available without persistent storage. */ }
  return podeContinuar();
};
