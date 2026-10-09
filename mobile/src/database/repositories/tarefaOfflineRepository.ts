import * as Crypto from "expo-crypto";

import { getDatabase } from "../database";

import {
  buscarTarefaLocalPorLocalId,
  type LocalTarefa,
} from "./tarefaLocalRepository";

import type {
  TarefaReferencia,
  TarefaRequest,
} from "../../services/tarefaTypes";

function normalizarPayload(
  payload: TarefaRequest
): TarefaRequest {
  return {
    idUsuario: payload.idUsuario,
    idDisciplina: payload.idDisciplina,
    titulo: payload.titulo.trim(),
    tipo: payload.tipo.trim(),
    descricao:
      payload.descricao?.trim() || "",
    dataHoraInicio:
      payload.dataHoraInicio ?? null,
    dataEntrega:
      payload.dataEntrega,
    prioridade:
      payload.prioridade.trim(),
  };
}

export async function criarTarefaOffline(
  payload: TarefaRequest
): Promise<LocalTarefa> {
  const db = await getDatabase();

  const localId =
    Crypto.randomUUID();

  const clientTxId =
    Crypto.randomUUID();

  const agora =
    new Date().toISOString();

  const tarefaNormalizada =
    normalizarPayload(payload);

  await db.withExclusiveTransactionAsync(
    async (txn) => {
      await txn.runAsync(
        `
          INSERT INTO local_tarefa (
            local_id,
            server_id,
            id_disciplina,
            nome_disciplina,
            titulo,
            tipo,
            descricao,
            data_hora_inicio,
            data_entrega,
            data_conclusao,
            status,
            prioridade,
            xp_gerado,
            server_version,
            sync_status,
            updated_at_local
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?
          )
        `,
        localId,
        null,
        tarefaNormalizada.idDisciplina,
        "",
        tarefaNormalizada.titulo,
        tarefaNormalizada.tipo,
        tarefaNormalizada.descricao ?? null,
        tarefaNormalizada.dataHoraInicio ?? null,
        tarefaNormalizada.dataEntrega,
        null,
        "PENDENTE",
        tarefaNormalizada.prioridade,
        0,
        null,
        "PENDING",
        agora
      );

      await txn.runAsync(
        `
          INSERT INTO sync_outbox (
            client_tx_id,
            entity_local_id,
            entity_type,
            operation,
            payload,
            status,
            attempts,
            last_error,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        clientTxId,
        localId,
        "TAREFA",
        "CREATE",
        JSON.stringify(
          tarefaNormalizada
        ),
        "PENDING",
        0,
        null,
        agora
      );
    }
  );

  const tarefa =
    await buscarTarefaLocalPorLocalId(
      localId
    );

  if (!tarefa) {
    throw new Error(
      "Não foi possível recuperar a tarefa criada localmente."
    );
  }

  return tarefa;
}

export async function atualizarTarefaOffline(
  referencia: TarefaReferencia,
  payload: TarefaRequest
): Promise<LocalTarefa> {
  const db = await getDatabase();

  const agora =
    new Date().toISOString();

  const tarefaNormalizada =
    normalizarPayload(payload);

  let localIdEncontrado:
    | string
    | null = null;

  await db.withExclusiveTransactionAsync(
    async (txn) => {
      let tarefaLocal:
        | {
            local_id: string;
            server_id: number | null;
          }
        | null = null;

      if (referencia.localId) {
        tarefaLocal =
          await txn.getFirstAsync<{
            local_id: string;
            server_id: number | null;
          }>(
            `
              SELECT
                local_id,
                server_id
              FROM local_tarefa
              WHERE local_id = ?
            `,
            referencia.localId
          );
      } else if (
        referencia.idTarefa !==
        undefined
      ) {
        tarefaLocal =
          await txn.getFirstAsync<{
            local_id: string;
            server_id: number | null;
          }>(
            `
              SELECT
                local_id,
                server_id
              FROM local_tarefa
              WHERE server_id = ?
            `,
            referencia.idTarefa
          );
      }

      if (!tarefaLocal) {
        throw new Error(
          "Tarefa não encontrada no armazenamento local."
        );
      }

      localIdEncontrado =
        tarefaLocal.local_id;

      await txn.runAsync(
        `
          UPDATE local_tarefa
          SET
            id_disciplina = ?,
            titulo = ?,
            tipo = ?,
            descricao = ?,
            data_hora_inicio = ?,
            data_entrega = ?,
            prioridade = ?,
            sync_status = 'PENDING',
            updated_at_local = ?
          WHERE local_id = ?
        `,
        tarefaNormalizada.idDisciplina,
        tarefaNormalizada.titulo,
        tarefaNormalizada.tipo,
        tarefaNormalizada.descricao ??
          null,
        tarefaNormalizada.dataHoraInicio ??
          null,
        tarefaNormalizada.dataEntrega,
        tarefaNormalizada.prioridade,
        agora,
        tarefaLocal.local_id
      );


      if (
        tarefaLocal.server_id === null
      ) {
        const createPendente =
          await txn.getFirstAsync<{
            id: number;
          }>(
            `
              SELECT id
              FROM sync_outbox
              WHERE
                entity_local_id = ?
                AND entity_type = 'TAREFA'
                AND operation = 'CREATE'
                AND status = 'PENDING'
              ORDER BY id ASC
              LIMIT 1
            `,
            tarefaLocal.local_id
          );

        if (createPendente) {
          await txn.runAsync(
            `
              UPDATE sync_outbox
              SET
                payload = ?,
                last_error = NULL
              WHERE id = ?
            `,
            JSON.stringify(
              tarefaNormalizada
            ),
            createPendente.id
          );

          return;
        }
      }


      await txn.runAsync(
        `
          INSERT INTO sync_outbox (
            client_tx_id,
            entity_local_id,
            entity_type,
            operation,
            payload,
            status,
            attempts,
            last_error,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        Crypto.randomUUID(),
        tarefaLocal.local_id,
        "TAREFA",
        "UPDATE",
        JSON.stringify(
          tarefaNormalizada
        ),
        "PENDING",
        0,
        null,
        agora
      );
    }
  );

  if (!localIdEncontrado) {
    throw new Error(
      "Não foi possível identificar a tarefa atualizada."
    );
  }

  const tarefa =
    await buscarTarefaLocalPorLocalId(
      localIdEncontrado
    );

  if (!tarefa) {
    throw new Error(
      "Não foi possível recuperar a tarefa atualizada localmente."
    );
  }

  return tarefa;
}

export async function excluirTarefaOffline(
  referencia: TarefaReferencia,
  idUsuario: number
): Promise<void> {
  const db = await getDatabase();

  const agora =
    new Date().toISOString();

  await db.withExclusiveTransactionAsync(
    async (txn) => {
      let tarefaLocal:
        | {
            local_id: string;
            server_id: number | null;
          }
        | null = null;

      if (referencia.localId) {
        tarefaLocal =
          await txn.getFirstAsync<{
            local_id: string;
            server_id: number | null;
          }>(
            `
              SELECT
                local_id,
                server_id
              FROM local_tarefa
              WHERE local_id = ?
            `,
            referencia.localId
          );
      } else if (
        referencia.idTarefa !==
        undefined
      ) {
        tarefaLocal =
          await txn.getFirstAsync<{
            local_id: string;
            server_id: number | null;
          }>(
            `
              SELECT
                local_id,
                server_id
              FROM local_tarefa
              WHERE server_id = ?
            `,
            referencia.idTarefa
          );
      }

      if (!tarefaLocal) {
        throw new Error(
          "Tarefa não encontrada no armazenamento local."
        );
      }


      if (
        tarefaLocal.server_id === null
      ) {
        const createPendente =
          await txn.getFirstAsync<{
            id: number;
          }>(
            `
              SELECT id
              FROM sync_outbox
              WHERE
                entity_local_id = ?
                AND entity_type = 'TAREFA'
                AND operation = 'CREATE'
                AND status = 'PENDING'
              ORDER BY id ASC
              LIMIT 1
            `,
            tarefaLocal.local_id
          );

        if (createPendente) {
          await txn.runAsync(
            `
              DELETE FROM sync_outbox
              WHERE entity_local_id = ?
            `,
            tarefaLocal.local_id
          );

          await txn.runAsync(
            `
              DELETE FROM local_tarefa
              WHERE local_id = ?
            `,
            tarefaLocal.local_id
          );

          return;
        }
      }


      const deleteExistente =
        await txn.getFirstAsync<{
          id: number;
        }>(
          `
            SELECT id
            FROM sync_outbox
            WHERE
              entity_local_id = ?
              AND entity_type = 'TAREFA'
              AND operation = 'DELETE'
              AND status IN (
                'PENDING',
                'PROCESSING',
                'ERROR'
              )
            ORDER BY id DESC
            LIMIT 1
          `,
          tarefaLocal.local_id
        );

      if (!deleteExistente) {
        await txn.runAsync(
          `
            INSERT INTO sync_outbox (
              client_tx_id,
              entity_local_id,
              entity_type,
              operation,
              payload,
              status,
              attempts,
              last_error,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          Crypto.randomUUID(),
          tarefaLocal.local_id,
          "TAREFA",
          "DELETE",
          JSON.stringify({
            idUsuario,
          }),
          "PENDING",
          0,
          null,
          agora
        );
      }

      await txn.runAsync(
        `
          UPDATE local_tarefa
          SET
            sync_status = 'PENDING',
            updated_at_local = ?
          WHERE local_id = ?
        `,
        agora,
        tarefaLocal.local_id
      );
    }
  );
}