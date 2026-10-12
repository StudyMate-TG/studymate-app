import * as Crypto from "expo-crypto";

import { getDatabase } from "../database";

import type { TarefaResponse } from "../../services/tarefaTypes";

export async function aplicarPullTarefas(
  tarefas: TarefaResponse[],
  idUsuario: number,
  novoCursor: string
): Promise<boolean> {
  const db = await getDatabase(idUsuario);
  let cursorAvancou = false;

  await db.withExclusiveTransactionAsync(
    async (txn) => {
      const pendencias = await txn.getAllAsync<{
        entity_local_id: string;
        operation: string;
        server_id: number | null;
      }>(`
        SELECT o.entity_local_id, o.operation, t.server_id
        FROM sync_outbox o
        LEFT JOIN local_tarefa t ON t.local_id = o.entity_local_id
        WHERE o.entity_type = 'TAREFA'
          AND o.status IN ('PENDING', 'PROCESSING', 'ERROR')
      `);
      const tarefasPendentes = new Set(pendencias.map((item) => item.entity_local_id));
      const possuiCreateSemId = pendencias.some((item) => item.operation === "CREATE" && item.server_id === null);

      for (const tarefa of tarefas) {
        if (tarefa.idTarefa === undefined) {
          throw new Error(
            "Tarefa recebida do servidor sem idTarefa."
          );
        }

        const existente =
          await txn.getFirstAsync<{
            local_id: string;
          }>(
            `
              SELECT local_id
              FROM local_tarefa
              WHERE server_id = ?
            `,
            tarefa.idTarefa
          );

        // Local edits and deletions win until their outbox operation is confirmed.
        if (existente && tarefasPendentes.has(existente.local_id)) continue;
        // A server CREATE may already exist after a lost response. Wait for replay
        // to recover its id before inserting an unrelated local copy of that row.
        if (!existente && possuiCreateSemId) continue;

        if (tarefa.deletedAt) {
          if (existente) {
            await txn.runAsync(
              `
                DELETE FROM local_tarefa
                WHERE server_id = ?
              `,
              tarefa.idTarefa
            );
          }

          continue;
        }

        const agora =
          new Date().toISOString();

        if (existente) {
          await txn.runAsync(
            `
              UPDATE local_tarefa
              SET
                id_disciplina = ?,
                nome_disciplina = ?,
                titulo = ?,
                tipo = ?,
                descricao = ?,
                data_hora_inicio = ?,
                data_entrega = ?,
                data_conclusao = ?,
                status = ?,
                prioridade = ?,
                xp_gerado = ?,
                server_version = ?,
                sync_status = 'SYNCED',
                updated_at_local = ?
              WHERE server_id = ?
            `,
            tarefa.idDisciplina,
            tarefa.nomeDisciplina ?? "",
            tarefa.titulo,
            tarefa.tipo,
            tarefa.descricao,
            tarefa.dataHoraInicio,
            tarefa.dataEntrega,
            tarefa.dataConclusao,
            tarefa.status,
            tarefa.prioridade,
            tarefa.xpGerado ?? 0,
            tarefa.version ?? 0,
            agora,
            tarefa.idTarefa
          );
        } else {
          const localId =
            Crypto.randomUUID();

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
            tarefa.idTarefa,
            tarefa.idDisciplina,
            tarefa.nomeDisciplina ?? "",
            tarefa.titulo,
            tarefa.tipo,
            tarefa.descricao,
            tarefa.dataHoraInicio,
            tarefa.dataEntrega,
            tarefa.dataConclusao,
            tarefa.status,
            tarefa.prioridade,
            tarefa.xpGerado ?? 0,
            tarefa.version ?? 0,
            "SYNCED",
            agora
          );
        }
      }

      if (pendencias.length > 0) return;

      await txn.runAsync(
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
        `tarefas_cursor_${idUsuario}`,
        novoCursor
      );
      cursorAvancou = true;
    }
  );
  return cursorAvancou;
}
