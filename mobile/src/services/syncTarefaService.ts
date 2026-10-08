import { API_BASE_URL } from "./apiConfig";

import type { TarefaResponse } from "./tarefaTypes";

import {
  buscarMetadata,
} from "../database/repositories/syncMetadataRepository";

import {
  aplicarPullTarefas,
} from "../database/repositories/tarefaSyncRepository";

type SyncTarefaPullResponse = {
  tarefas: TarefaResponse[];
  cursor: string;
};

export async function executarPullTarefas(
  idUsuario: number
): Promise<void> {
  const chaveCursor =
    `tarefas_cursor_${idUsuario}`;

  const cursor =
    await buscarMetadata(chaveCursor);

  const parametros =
    new URLSearchParams();

  parametros.append(
    "idUsuario",
    String(idUsuario)
  );

  if (cursor) {
    parametros.append(
      "cursor",
      cursor
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/sync/tarefas?${parametros.toString()}`
  );

  if (!response.ok) {
    const texto =
      await response.text();

    throw new Error(
      texto ||
        "Não foi possível sincronizar as tarefas."
    );
  }

  const dados =
    (await response.json()) as SyncTarefaPullResponse;

  await aplicarPullTarefas(
    dados.tarefas,
    idUsuario,
    dados.cursor
  );

  console.log(
    `Pull concluído: ${dados.tarefas.length} alteração(ões).`
  );
}