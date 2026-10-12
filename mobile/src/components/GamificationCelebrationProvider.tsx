import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onSessionEnded, requireSessionUser } from "../services/apiClient";
import { obterGamificacao, onGamificacaoCarregada, onProgressoAtualizado, type GamificacaoResponse } from "../services/gamificacaoService";
import { detectarOfensivaAcesa, reservarComemoracao, type OfensivaAcesa } from "../utils/ofensivaUtils";
import { StreakCelebration } from "./StreakCelebration";

export const GamificationCelebrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [conquista, setConquista] = useState<OfensivaAcesa | null>(null);
  const snapshot = useRef<{ idUsuario: number; progresso: GamificacaoResponse } | null>(null);
  const geracao = useRef(0);
  const reservadas = useRef(new Set<string>());

  useEffect(() => {
    let montado = true;
    const limpar = () => {
      geracao.current++;
      snapshot.current = null;
      setConquista(null);
    };
    const removeSessao = onSessionEnded(limpar);
    const removeSnapshot = onGamificacaoCarregada((idUsuario, progresso) => {
      if (snapshot.current && snapshot.current.idUsuario !== idUsuario) limpar();
      snapshot.current = { idUsuario, progresso };
    });
    const removeEvento = onProgressoAtualizado((idUsuario, antesRecebido) => {
      const numero = geracao.current;
      const antes = antesRecebido === undefined
        ? snapshot.current?.idUsuario === idUsuario ? snapshot.current.progresso : null
        : antesRecebido;
      void (async () => {
        try {
          requireSessionUser(idUsuario);
          const depois = await obterGamificacao(idUsuario);
          if (!montado || numero !== geracao.current) return;
          const acesa = detectarOfensivaAcesa(antes, depois);
          if (!acesa) return;
          const chave = `studymate_ofensiva_comemorada_${idUsuario}_${acesa.data}`;
          const podeContinuar = () => {
            if (!montado || numero !== geracao.current) return false;
            try { requireSessionUser(idUsuario); return true; }
            catch { return false; }
          };
          const reservou = await reservarComemoracao(chave, reservadas.current, AsyncStorage, podeContinuar);
          if (!reservou || !podeContinuar()) return;
          setConquista(acesa);
        } catch {
          // A celebration failure never changes a confirmed task or attendance.
        }
      })();
    });
    return () => {
      montado = false;
      geracao.current++;
      removeSessao();
      removeSnapshot();
      removeEvento();
    };
  }, []);

  return <>{children}<StreakCelebration conquista={conquista} onClose={() => setConquista(null)} /></>;
};
