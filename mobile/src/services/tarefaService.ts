import { requireSessionUser } from "./apiClient";

import {
  criarTarefaOffline,
  atualizarTarefaOffline,
  excluirTarefaOffline,
  concluirTarefaOffline,
  reabrirTarefaOffline,
} from "../database/repositories/tarefaOfflineRepository";

import {
  listarTarefasLocais,
  buscarTarefaLocalPorLocalId,
  buscarTarefaLocalPorServerId,
  type LocalTarefa,
} from "../database/repositories/tarefaLocalRepository";

import {
  sincronizarTarefas,
} from "./tarefaSyncEngine";

import type {
  TarefaReferencia,
  TarefaRequest,
  TarefaResponse,
} from "./tarefaTypes";

import {
  buscarMetadata,
} from "../database/repositories/syncMetadataRepository";

export type {
  TarefaReferencia,
  TarefaRequest,
  TarefaResponse,
} from "./tarefaTypes";

function mapearLocalParaResponse(
  tarefa: LocalTarefa
): TarefaResponse {
  return {
    idTarefa:
      tarefa.serverId ?? undefined,

    localId:
      tarefa.localId,

    idDisciplina:
      tarefa.idDisciplina,

    nomeDisciplina:
      tarefa.nomeDisciplina,

    titulo:
      tarefa.titulo,

    tipo:
      tarefa.tipo,

    descricao:
      tarefa.descricao,

    dataHoraInicio:
      tarefa.dataHoraInicio,

    dataEntrega:
      tarefa.dataEntrega,

    dataConclusao:
      tarefa.dataConclusao,

    status:
      tarefa.status,

    prioridade:
      tarefa.prioridade,

    xpGerado:
      tarefa.xpGerado,

    updatedAt:
      tarefa.updatedAtLocal,

    deletedAt:
      null,

    version:
      tarefa.serverVersion ??
      undefined,

    syncStatus:
      tarefa.syncStatus,
  };
}

async function tentarSincronizar(
  idUsuario: number
): Promise<void> {
  try {
    await sincronizarTarefas(
      idUsuario
    );
  } catch (error) {
    requireSessionUser(idUsuario);
    console.warn(
      "Sincronização de tarefas não concluída. Utilizando dados locais.",
      error
    );
  }
}

export async function cadastrarTarefa(
  payload: TarefaRequest
): Promise<TarefaResponse> {
  requireSessionUser(payload.idUsuario);
  const tarefaLocal =
    await criarTarefaOffline(
      payload
    );

    void tentarSincronizar(
      payload.idUsuario
    );

  const tarefaAtualizada =
    await buscarTarefaLocalPorLocalId(
      tarefaLocal.localId
    );

  return mapearLocalParaResponse(
    tarefaAtualizada ??
      tarefaLocal
  );
}

export async function listarTarefas(
  idUsuario: number
): Promise<TarefaResponse[]> {
  requireSessionUser(idUsuario);

  const tarefas =
    await listarTarefasLocais();

  void tentarSincronizar(idUsuario);

  return tarefas.map(
    mapearLocalParaResponse
  );
}

export async function buscarTarefaPorId(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<TarefaResponse> {
  requireSessionUser(idUsuario);

  let tarefa:
    | LocalTarefa
    | null = null;

  if (referencia.localId) {
    tarefa =
      await buscarTarefaLocalPorLocalId(
        referencia.localId
      );
  }

  if (
    !tarefa &&
    referencia.idTarefa !== undefined
  ) {
    tarefa =
      await buscarTarefaLocalPorServerId(
        referencia.idTarefa
      );
  }

  if (!tarefa) {
    throw new Error(
      "Tarefa não encontrada no armazenamento local."
    );
  }

  void tentarSincronizar(idUsuario);

  return mapearLocalParaResponse(
    tarefa
  );
}

export async function atualizarTarefa(
  referencia: TarefaReferencia,
  idUsuario: number,
  payload: TarefaRequest
): Promise<TarefaResponse> {
  requireSessionUser(idUsuario);
  if (payload.idUsuario !== idUsuario) throw new Error("Usuário da tarefa inválido.");
  const tarefaLocal =
    await atualizarTarefaOffline(
      referencia,
      payload
    );

  void tentarSincronizar(
    idUsuario
  );

  const tarefaAtualizada =
    await buscarTarefaLocalPorLocalId(
      tarefaLocal.localId
    );

  return mapearLocalParaResponse(
    tarefaAtualizada ??
      tarefaLocal
  );
}

export async function excluirTarefa(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<void> {
  requireSessionUser(idUsuario);

  await excluirTarefaOffline(
    referencia,
    idUsuario
  );

  void tentarSincronizar(
    idUsuario
  );
}

export async function concluirTarefa(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<TarefaResponse> {
  requireSessionUser(idUsuario);

  const tarefaLocal =
    await concluirTarefaOffline(
      referencia,
      idUsuario
    );

  void tentarSincronizar(
    idUsuario
  );

  return mapearLocalParaResponse(
    tarefaLocal
  );
}

export async function reabrirTarefa(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<TarefaResponse> {
  requireSessionUser(idUsuario);

  const tarefaLocal =
    await reabrirTarefaOffline(
      referencia,
      idUsuario
    );

  void tentarSincronizar(
    idUsuario
  );

  return mapearLocalParaResponse(
    tarefaLocal
  );
}

export async function obterUltimaSincronizacaoTarefas(
  idUsuario: number
): Promise<string | null> {
  requireSessionUser(idUsuario);

  return buscarMetadata(
    `tarefas_last_sync_at_${idUsuario}`,
    idUsuario
  );
}
