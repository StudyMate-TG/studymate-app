import * as SQLite from "expo-sqlite";
import { DATABASE_SCHEMA } from "./migrations";
import { hasSession, requireSessionUser } from "../services/apiClient";

// Filas e tarefas de uma conta nunca são abertas pela sessão de outra conta.
// O banco anterior, sem proprietário, fica preservado e não é sincronizado.
const databases = new Map<number, Promise<SQLite.SQLiteDatabase>>();

async function openUserDatabase(idUsuario: number): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(`studymate-user-${idUsuario}.db`);
  await db.execAsync(DATABASE_SCHEMA);
  const colunas = await db.getAllAsync<{ name: string }>("PRAGMA table_info(local_tarefa)");
  if (!colunas.some((coluna) => coluna.name === "nome_disciplina")) {
    await db.execAsync("ALTER TABLE local_tarefa ADD COLUMN nome_disciplina TEXT NOT NULL DEFAULT '';");
  }
  return db;
}

export async function getDatabase(expectedUserId?: number): Promise<SQLite.SQLiteDatabase> {
  const idUsuario = requireSessionUser(expectedUserId);
  let pending = databases.get(idUsuario);
  if (!pending) {
    pending = openUserDatabase(idUsuario);
    databases.set(idUsuario, pending);
    pending.catch(() => { databases.delete(idUsuario); });
  }
  const db = await pending;
  requireSessionUser(idUsuario);
  return db;
}

export async function initializeDatabase(): Promise<void> {
  // App inicia antes do login; a primeira operação abre e prepara o banco da conta.
  if (hasSession()) await getDatabase();
}
