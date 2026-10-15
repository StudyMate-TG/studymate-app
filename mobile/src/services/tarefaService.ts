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

import {
  agendarNotificacaoTarefa,
  cancelarNotificacoesTarefa,
} from "./notificacaoService";

export type {
  TarefaReferencia,
  TarefaRequest,
  TarefaResponse,
} from "./tarefaTypes";

/*
 * =========================================================
 * MAPEAMENTO
 * =========================================================
 */

function mapearLocalParaResponse(
  tarefa: LocalTarefa
): TarefaResponse {
  return {
    idTarefa:
      tarefa.serverId ??
      undefined,

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

/*
 * =========================================================
 * SINCRONIZAÇÃO
 * =========================================================
 */

async function tentarSincronizar(
  idUsuario: number
): Promise<void> {
  try {
    await sincronizarTarefas(
      idUsuario
    );
  } catch (error) {
    requireSessionUser(
      idUsuario
    );

    console.warn(
      "Sincronização de tarefas não concluída. Utilizando dados locais.",
      error
    );
  }
}

/*
 * =========================================================
 * NOTIFICAÇÕES
 * =========================================================
 */

/**
 * Agenda ou reagenda o lembrete de uma tarefa.
 *
 * O localId é usado como identificação principal,
 * pois existe mesmo antes da sincronização com o backend.
 */
async function atualizarNotificacaoDaTarefa(
  tarefa: LocalTarefa
): Promise<void> {
  try {
    await agendarNotificacaoTarefa({
      localId:
        tarefa.localId,

      idTarefa:
        tarefa.serverId ??
        undefined,

      titulo:
        tarefa.titulo,

      nomeDisciplina:
        tarefa.nomeDisciplina,

      dataEntrega:
        tarefa.dataEntrega,
    });
  } catch (error) {
    /*
     * Uma falha na notificação não deve
     * impedir o funcionamento da tarefa.
     */
    console.warn(
      "Não foi possível atualizar o lembrete da tarefa.",
      error
    );
  }
}

/**
 * Cancela o lembrete relacionado
 * a uma determinada tarefa.
 */
async function cancelarNotificacaoDaTarefa(
  referencia: TarefaReferencia
): Promise<void> {
  try {
    await cancelarNotificacoesTarefa({
      localId:
        referencia.localId,

      idTarefa:
        referencia.idTarefa,
    });
  } catch (error) {
    console.warn(
      "Não foi possível cancelar o lembrete da tarefa.",
      error
    );
  }
}

/*
 * =========================================================
 * CADASTRAR
 * =========================================================
 */

export async function cadastrarTarefa(
  payload: TarefaRequest
): Promise<TarefaResponse> {
  requireSessionUser(
    payload.idUsuario
  );

  /*
   * Cria primeiro no SQLite.
   */
  const tarefaLocal =
    await criarTarefaOffline(
      payload
    );

  /*
   * Dispara a sincronização em segundo plano.
   */
  void tentarSincronizar(
    payload.idUsuario
  );

  /*
   * Busca novamente porque a sincronização
   * pode já ter atualizado algum dado local.
   */
  const tarefaAtualizada =
    await buscarTarefaLocalPorLocalId(
      tarefaLocal.localId
    );

  const tarefaFinal =
    tarefaAtualizada ??
    tarefaLocal;

  /*
   * Agenda o lembrete de 24h.
   */
  await atualizarNotificacaoDaTarefa(
    tarefaFinal
  );

  return mapearLocalParaResponse(
    tarefaFinal
  );
}

/*
 * =========================================================
 * LISTAR
 * =========================================================
 */

export async function listarTarefas(
  idUsuario: number
): Promise<TarefaResponse[]> {
  requireSessionUser(
    idUsuario
  );

  const tarefas =
    await listarTarefasLocais();

  /*
   * Retorna imediatamente os dados locais
   * e sincroniza em segundo plano.
   */
  void tentarSincronizar(
    idUsuario
  );

  return tarefas.map(
    mapearLocalParaResponse
  );
}

// Refresh the UI after Push/Pull without starting another sync cycle.
export async function listarTarefasConfirmadas(idUsuario: number): Promise<TarefaResponse[]> {
  requireSessionUser(idUsuario);
  const tarefas = await listarTarefasLocais();
  requireSessionUser(idUsuario);
  return tarefas.map(mapearLocalParaResponse);
}

export async function buscarTarefaPorId(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<TarefaResponse> {
  requireSessionUser(
    idUsuario
  );

  let tarefa:
    | LocalTarefa
    | null = null;

  /*
   * Primeiro tenta localizar pelo
   * identificador local.
   */
  if (
    referencia.localId
  ) {
    tarefa =
      await buscarTarefaLocalPorLocalId(
        referencia.localId
      );
  }

  /*
   * Se não encontrou, tenta pelo
   * identificador do backend.
   */
  if (
    !tarefa &&
    referencia.idTarefa !==
      undefined
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

  void tentarSincronizar(
    idUsuario
  );

  return mapearLocalParaResponse(
    tarefa
  );
}

/*
 * =========================================================
 * ATUALIZAR
 * =========================================================
 */

export async function atualizarTarefa(
  referencia: TarefaReferencia,
  idUsuario: number,
  payload: TarefaRequest
): Promise<TarefaResponse> {
  requireSessionUser(
    idUsuario
  );

  if (
    payload.idUsuario !==
    idUsuario
  ) {
    throw new Error(
      "Usuário da tarefa inválido."
    );
  }

  const tarefaLocal =
    await atualizarTarefaOffline(
      referencia,
      payload
    );

  /*
   * Sincroniza em segundo plano.
   */
  void tentarSincronizar(
    idUsuario
  );

  const tarefaAtualizada =
    await buscarTarefaLocalPorLocalId(
      tarefaLocal.localId
    );

  const tarefaFinal =
    tarefaAtualizada ??
    tarefaLocal;

  /*
   * O serviço de notificação cancela
   * o lembrete anterior e cria um novo.
   *
   * Isso é importante caso a data
   * de entrega tenha sido alterada.
   */
  await atualizarNotificacaoDaTarefa(
    tarefaFinal
  );

  return mapearLocalParaResponse(
    tarefaFinal
  );
}

/*
 * =========================================================
 * EXCLUIR
 * =========================================================
 */

export async function excluirTarefa(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<void> {
  requireSessionUser(
    idUsuario
  );

  /*
   * Exclui / marca a tarefa localmente
   * conforme o funcionamento do
   * repositório offline.
   */
  await excluirTarefaOffline(
    referencia,
    idUsuario
  );

  /*
   * Uma tarefa excluída não deve continuar
   * enviando lembretes.
   */
  await cancelarNotificacaoDaTarefa(
    referencia
  );

  void tentarSincronizar(
    idUsuario
  );
}

/*
 * =========================================================
 * CONCLUIR
 * =========================================================
 */

export async function concluirTarefa(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<TarefaResponse> {
  requireSessionUser(
    idUsuario
  );

  const tarefaLocal =
    await concluirTarefaOffline(
      referencia,
      idUsuario
    );

  /*
   * Depois de concluída, não faz sentido
   * manter o aviso de prazo.
   *
   * Utilizamos os identificadores da própria
   * tarefa retornada pelo SQLite.
   */
  try {
    await cancelarNotificacoesTarefa({
      localId:
        tarefaLocal.localId,

      idTarefa:
        tarefaLocal.serverId ??
        undefined,
    });
  } catch (error) {
    console.warn(
      "Tarefa concluída, mas não foi possível cancelar seu lembrete.",
      error
    );
  }

  void tentarSincronizar(
    idUsuario
  );

  return mapearLocalParaResponse(
    tarefaLocal
  );
}

/*
 * =========================================================
 * REABRIR
 * =========================================================
 */

export async function reabrirTarefa(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<TarefaResponse> {
  requireSessionUser(
    idUsuario
  );

  const tarefaLocal =
    await reabrirTarefaOffline(
      referencia,
      idUsuario
    );

  /*
   * Como a tarefa voltou a ficar pendente,
   * tentamos agendar novamente o lembrete.
   *
   * Caso faltem menos de 24h para a entrega,
   * o notificacaoService simplesmente não
   * cria o lembrete.
   */
  await atualizarNotificacaoDaTarefa(
    tarefaLocal
  );

  void tentarSincronizar(
    idUsuario
  );

  return mapearLocalParaResponse(
    tarefaLocal
  );
}

/*
 * =========================================================
 * METADATA DE SINCRONIZAÇÃO
 * =========================================================
 */

export async function obterUltimaSincronizacaoTarefas(
  idUsuario: number
): Promise<string | null> {
  requireSessionUser(
    idUsuario
  );

  return buscarMetadata(
    `tarefas_last_sync_at_${idUsuario}`,
    idUsuario
  );
}