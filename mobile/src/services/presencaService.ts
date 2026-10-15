import { apiFetch, handleResponse, requireSessionUser } from "./apiClient";
import { API_BASE_URL } from "./apiConfig";
import { capturarProgressoAntesAtividade, notificarProgressoAtualizado } from "./gamificacaoService";
import { obterDataHojeSaoPaulo } from "../utils/dataEstudoUtils";

export type PresencaResponse = {
  idPresenca: number;
  idDisciplina: number;
  nomeDisciplina: string;
  dataPresenca: string;
  xpGerado: number;
};

export const cadastrarPresenca = async (
  idUsuario: number,
  payload: { idDisciplina: number; dataPresenca: string }
): Promise<PresencaResponse> => {
  requireSessionUser(idUsuario);
  if (payload.dataPresenca !== obterDataHojeSaoPaulo()) {
    throw new Error("Presenças podem ser registradas somente para hoje, no horário de Brasília.");
  }
  const antes = await capturarProgressoAntesAtividade(idUsuario);
  const dataPresenca = obterDataHojeSaoPaulo();
  const response = await apiFetch(`${API_BASE_URL}/presencas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, dataPresenca }),
  }, true, idUsuario);
  const presenca = await handleResponse<PresencaResponse>(response);
  requireSessionUser(idUsuario);
  notificarProgressoAtualizado(idUsuario, antes);
  return presenca;
};
