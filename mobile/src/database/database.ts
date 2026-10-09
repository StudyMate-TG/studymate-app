import * as SQLite from "expo-sqlite";

import {
  DATABASE_SCHEMA,
  MIGRATION_ADD_COMPLETE_TO_SYNC_OUTBOX,
  MIGRATION_ADD_REOPEN_TO_SYNC_OUTBOX,
} from "./migrations";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync("studymate.db");
  }

  return database;
}

async function migrarSyncOutboxParaComplete(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const tabela =
    await db.getFirstAsync<{
      sql: string | null;
    }>(`
      SELECT sql
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'sync_outbox'
    `);

  const sqlTabela =
    tabela?.sql?.toUpperCase() ?? "";

  const aceitaComplete =
    sqlTabela.includes("'COMPLETE'");

  if (aceitaComplete) {
    return;
  }

  console.log(
    "[Database] Migrando sync_outbox para suportar COMPLETE..."
  );

  await db.withTransactionAsync(
    async () => {
      await db.execAsync(
        MIGRATION_ADD_COMPLETE_TO_SYNC_OUTBOX
      );
    }
  );

  console.log(
    "[Database] Migration de sync_outbox concluída."
  );
}

async function migrarSyncOutboxParaReopen(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const tabela =
    await db.getFirstAsync<{
      sql: string | null;
    }>(`
      SELECT sql
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'sync_outbox'
    `);

  const sqlTabela =
    tabela?.sql?.toUpperCase() ?? "";

  const aceitaReopen =
    sqlTabela.includes("'REOPEN'");

  if (aceitaReopen) {
    return;
  }

  console.log(
    "[Database] Migrando sync_outbox para suportar REOPEN..."
  );

  await db.withTransactionAsync(
    async () => {
      await db.execAsync(
        MIGRATION_ADD_REOPEN_TO_SYNC_OUTBOX
      );
    }
  );

  console.log(
    "[Database] Migration REOPEN concluída."
  );
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(DATABASE_SCHEMA);

  await migrarSyncOutboxParaComplete(db);

  await migrarSyncOutboxParaReopen(db);


  const colunas =
    await db.getAllAsync<{
      name: string;
    }>(`
      PRAGMA table_info(local_tarefa)
    `);

  const possuiNomeDisciplina =
    colunas.some(
      (coluna) =>
        coluna.name === "nome_disciplina"
    );

  if (!possuiNomeDisciplina) {
    await db.execAsync(`
      ALTER TABLE local_tarefa
      ADD COLUMN nome_disciplina TEXT
      NOT NULL DEFAULT '';
    `);
  }
}