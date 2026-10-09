import { API_BASE_URL } from "./apiConfig";

import { getDatabase } from "../database/database";

import {
  listarOperacoesPendentes,
  marcarOperacaoComoProcessando,
  marcarOperacaoComErro,
  type SyncOutboxItem,
} from "../database/repositories/syncOutboxRepository";

import {
  executarPullTarefas,
} from "./syncTarefaService";

import type {
  TarefaRequest,
} from "./tarefaTypes";

import {
  salvarMetadata,
} from "../database/repositories/syncMetadataRepository";

type SyncTarefaResponse = {
  clientTxId: string;
  status: string;
  idTarefa: number | null;
  alreadyProcessed: boolean;
};

async function recuperarOperacoesInterrompidas(): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE sync_outbox
      SET status = 'PENDING'
      WHERE status = 'PROCESSING'
    `
  );
}

async function marcarTarefaComErro(
  localId: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE local_tarefa
      SET sync_status = 'ERROR'
      WHERE local_id = ?
    `,
    localId
  );
}

async function finalizarOperacaoSincronizada(
  operacao: SyncOutboxItem,
  resposta: SyncTarefaResponse
): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(
    async (txn) => {
      if (operacao.operation === "CREATE") {
        if (
          resposta.idTarefa === null ||
          resposta.idTarefa === undefined
        ) {
          throw new Error(
            "O servidor não retornou o id da tarefa criada."
          );
        }

        await txn.runAsync(
          `
            UPDATE local_tarefa
            SET server_id = ?
            WHERE local_id = ?
          `,
          resposta.idTarefa,
          operacao.entityLocalId
        );
      }

      if (operacao.operation === "DELETE") {
        await txn.runAsync(
          `
            DELETE FROM sync_outbox
            WHERE id = ?
          `,
          operacao.id
        );

        await txn.runAsync(
          `
            DELETE FROM local_tarefa
            WHERE local_id = ?
          `,
          operacao.entityLocalId
        );

        return;
      }

      await txn.runAsync(
        `
          DELETE FROM sync_outbox
          WHERE id = ?
        `,
        operacao.id
      );

      const restante =
        await txn.getFirstAsync<{
          quantidade: number;
        }>(
          `
            SELECT COUNT(*) AS quantidade
            FROM sync_outbox
            WHERE
              entity_local_id = ?
              AND entity_type = 'TAREFA'
              AND status IN (
                'PENDING',
                'PROCESSING',
                'ERROR'
              )
          `,
          operacao.entityLocalId
        );

      const possuiPendencia =
        (restante?.quantidade ?? 0) > 0;

      await txn.runAsync(
        `
          UPDATE local_tarefa
          SET sync_status = ?
          WHERE local_id = ?
        `,
        possuiPendencia
          ? "PENDING"
          : "SYNCED",
        operacao.entityLocalId
      );
    }
  );
}

async function enviarOperacao(
  operacao: SyncOutboxItem,
  idUsuario: number
): Promise<void> {
  const db = await getDatabase();

  const tarefaLocal =
    await db.getFirstAsync<{
      server_id: number | null;
    }>(
      `
        SELECT server_id
        FROM local_tarefa
        WHERE local_id = ?
      `,
      operacao.entityLocalId
    );

  if (!tarefaLocal) {
    throw new Error(
      `Tarefa local ${operacao.entityLocalId} não encontrada.`
    );
  }

  let tarefa:
    | TarefaRequest
    | null = null;

  if (
    operacao.operation === "CREATE" ||
    operacao.operation === "UPDATE"
  ) {
    try {
      tarefa =
        JSON.parse(
          operacao.payload
        ) as TarefaRequest;
    } catch {
      throw new Error(
        "Payload da operação de sincronização é inválido."
      );
    }
  }

  let idTarefa:
    | number
    | null = null;

  if (
    operacao.operation !== "CREATE"
  ) {
    if (
      tarefaLocal.server_id === null
    ) {
      throw new Error(
        `A operação ${operacao.operation} ainda não possui server_id.`
      );
    }

    idTarefa =
      tarefaLocal.server_id;
  }

  const body = {
    clientTxId:
      operacao.clientTxId,

    idUsuario,

    operation:
      operacao.operation,

    idTarefa,

    tarefa,
  };

  const response = await fetch(
    `${API_BASE_URL}/sync/tarefas`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body:
        JSON.stringify(body),
    }
  );

  const texto =
    await response.text();

  let dados: any = {};

  try {
    dados =
      texto
        ? JSON.parse(texto)
        : {};
  } catch {
    dados = {};
  }

  if (!response.ok) {
    throw new Error(
      dados.mensagem ||
        dados.message ||
        dados.error ||
        texto ||
        "Erro ao sincronizar tarefa."
    );
  }

  const resposta =
    dados as SyncTarefaResponse;

  await finalizarOperacaoSincronizada(
    operacao,
    resposta
  );
}

async function executarPushTarefas(
  idUsuario: number
): Promise<void> {
  await recuperarOperacoesInterrompidas();

  const operacoes =
    await listarOperacoesPendentes();

  for (const operacao of operacoes) {

    if (
      operacao.entityType !== "TAREFA"
    ) {
      continue;
    }

    try {
      await marcarOperacaoComoProcessando(
        operacao.id
      );

      await enviarOperacao(
        operacao,
        idUsuario
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido de sincronização.";

      await marcarOperacaoComErro(
        operacao.id,
        mensagem
      );

      await marcarTarefaComErro(
        operacao.entityLocalId
      );

      throw error;
    }
  }
}

export async function sincronizarTarefas(
  idUsuario: number
): Promise<void> {
  await executarPushTarefas(
    idUsuario
  );

  await executarPullTarefas(
    idUsuario
  );

  await salvarMetadata(
    `tarefas_last_sync_at_${idUsuario}`,
    new Date().toISOString()
  );
}