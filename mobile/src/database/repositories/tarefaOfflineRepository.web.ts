import type {
  TarefaReferencia,
  TarefaRequest,
} from "../../services/tarefaTypes";

import type {
  LocalTarefa,
} from "./tarefaLocalRepository";

export async function criarTarefaOffline(
  _payload: TarefaRequest
): Promise<LocalTarefa> {
  throw new Error(
    "Operações offline estão disponíveis apenas no aplicativo Mobile."
  );
}

export async function atualizarTarefaOffline(
  _referencia: TarefaReferencia,
  _payload: TarefaRequest
): Promise<LocalTarefa> {
  throw new Error(
    "Operações offline estão disponíveis apenas no aplicativo Mobile."
  );
}

export async function excluirTarefaOffline(
  _referencia: TarefaReferencia,
  _idUsuario: number
): Promise<void> {
  throw new Error(
    "Operações offline estão disponíveis apenas no aplicativo Mobile."
  );
}