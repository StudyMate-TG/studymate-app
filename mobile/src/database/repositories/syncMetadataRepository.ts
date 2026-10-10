import { getDatabase } from "../database";

export async function buscarMetadata(
  key: string,
  idUsuario?: number
): Promise<string | null> {
  const db = await getDatabase(idUsuario);

  const resultado =
    await db.getFirstAsync<{
      value: string | null;
    }>(
      `
        SELECT value
        FROM sync_metadata
        WHERE key = ?
      `,
      key
    );

  return resultado?.value ?? null;
}

export async function salvarMetadata(
  key: string,
  value: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO sync_metadata (
        key,
        value
      )
      VALUES (?, ?)
      ON CONFLICT(key)
      DO UPDATE SET
        value = excluded.value
    `,
    key,
    value
  );
}

export async function removerMetadata(
  key: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM sync_metadata
      WHERE key = ?
    `,
    key
  );
}