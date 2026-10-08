import * as SQLite from "expo-sqlite";

import { DATABASE_SCHEMA } from "./migrations";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync("studymate.db");
  }

  return database;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(DATABASE_SCHEMA);

  const colunas =
    await db.getAllAsync<{
      name: string;
    }>(
      `
        PRAGMA table_info(local_tarefa)
      `
    );

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