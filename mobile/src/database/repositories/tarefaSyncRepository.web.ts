import type { TarefaResponse } from "../../services/tarefaTypes";

export async function aplicarPullTarefas(
  _tarefas: TarefaResponse[],
  _idUsuario: number,
  _novoCursor: string
): Promise<void> {
  return;
}