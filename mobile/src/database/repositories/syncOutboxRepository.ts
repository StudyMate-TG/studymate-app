import * as Crypto from "expo-crypto";

import { getDatabase } from "../database";

export type OutboxOperation =
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export type OutboxStatus =
  | "PENDING"
  | "PROCESSING"
  | "SYNCED"
  | "ERROR";

export type SyncOutboxItem = {
  id: number;
  clientTxId: string;
  entityLocalId: string;
  entityType: string;
  operation: OutboxOperation;
  payload: string;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

type SyncOutboxRow = {
  id: number;
  client_tx_id: string;
  entity_local_id: string;
  entity_type: string;
  operation: OutboxOperation;
  payload: string;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
};

function mapRow(row: SyncOutboxRow): SyncOutboxItem {
  return {
    id: row.id,
    clientTxId: row.client_tx_id,
    entityLocalId: row.entity_local_id,
    entityType: row.entity_type,
    operation: row.operation,
    payload: row.payload,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
  };
}

export async function criarOperacaoOutbox(
  entityLocalId: string,
  entityType: string,
  operation: OutboxOperation,
  payload: unknown
): Promise<SyncOutboxItem> {
  const db = await getDatabase();

  const clientTxId = Crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const resultado = await db.runAsync(
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
      VALUES (?, ?, ?, ?, ?, 'PENDING', 0, NULL, ?)
    `,
    clientTxId,
    entityLocalId,
    entityType,
    operation,
    JSON.stringify(payload),
    createdAt
  );

  const item = await db.getFirstAsync<SyncOutboxRow>(
    `
      SELECT *
      FROM sync_outbox
      WHERE id = ?
    `,
    resultado.lastInsertRowId
  );

  if (!item) {
    throw new Error(
      "Não foi possível recuperar a operação criada na fila de sincronização."
    );
  }

  return mapRow(item);
}

export async function listarOperacoesPendentes(): Promise<
  SyncOutboxItem[]
> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<SyncOutboxRow>(
    `
      SELECT *
      FROM sync_outbox
      WHERE status IN ('PENDING', 'ERROR')
      ORDER BY created_at ASC, id ASC
    `
  );

  return rows.map(mapRow);
}

export async function marcarOperacaoComoProcessando(
  id: number
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE sync_outbox
      SET
        status = 'PROCESSING',
        attempts = attempts + 1,
        last_error = NULL
      WHERE id = ?
    `,
    id
  );
}

export async function marcarOperacaoComoSincronizada(
  id: number
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE sync_outbox
      SET
        status = 'SYNCED',
        last_error = NULL
      WHERE id = ?
    `,
    id
  );
}

export async function marcarOperacaoComErro(
  id: number,
  erro: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE sync_outbox
      SET
        status = 'ERROR',
        last_error = ?
      WHERE id = ?
    `,
    erro,
    id
  );
}

export async function removerOperacaoOutbox(
  id: number
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM sync_outbox
      WHERE id = ?
    `,
    id
  );
}