import { useCallback, useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { AppState } from "react-native";
import { obterUsuarioSessao } from "../services/authService";
import { obterGamificacao, onProgressoAtualizado, type GamificacaoResponse } from "../services/gamificacaoService";

export const useGamificacao = () => {
  const isFocused = useIsFocused();
  const [progresso, setProgresso] = useState<GamificacaoResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [xpConfirmado, setXpConfirmado] = useState(0);
  const anterior = useRef<GamificacaoResponse | null>(null);
  const requisicao = useRef(0);
  const ativo = useRef(false);

  const atualizar = useCallback(async (celebrar = false, idEvento?: number) => {
    const numero = ++requisicao.current;
    try {
      const usuario = await obterUsuarioSessao();
      if (!ativo.current || !usuario || (idEvento !== undefined && usuario.idUsuario !== idEvento)) return;
      const dados = await obterGamificacao(usuario.idUsuario);
      if (!ativo.current || numero !== requisicao.current) return;
      if (celebrar && anterior.current && dados.xpTotal > anterior.current.xpTotal) {
        setXpConfirmado(dados.xpTotal - anterior.current.xpTotal);
      }
      anterior.current = dados;
      setProgresso(dados);
      setErro("");
    } catch (error) {
      if (ativo.current && numero === requisicao.current) {
        setErro(error instanceof Error ? error.message : "Não foi possível atualizar seu progresso.");
      }
    } finally {
      if (ativo.current && numero === requisicao.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    ativo.current = isFocused;
    if (!isFocused) return;
    void atualizar();
    const unsubscribe = onProgressoAtualizado((idUsuario) => { void atualizar(true, idUsuario); });
    const appStateListener = AppState.addEventListener("change", (estado) => {
      if (estado === "active") void atualizar();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void atualizar();
    }, 60_000);
    return () => {
      ativo.current = false;
      requisicao.current++;
      unsubscribe();
      appStateListener.remove();
      clearInterval(timer);
    };
  }, [isFocused, atualizar]);

  useEffect(() => {
    if (!xpConfirmado) return;
    const timer = setTimeout(() => setXpConfirmado(0), 5500);
    return () => clearTimeout(timer);
  }, [xpConfirmado]);

  return { progresso, carregando, erro, xpConfirmado, atualizar: () => atualizar() };
};
