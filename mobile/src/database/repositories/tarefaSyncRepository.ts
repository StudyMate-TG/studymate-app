import * as Crypto from "expo-crypto";

import { getDatabase } from "../database";

import type { TarefaResponse } from "../../services/tarefaTypes";

export async function aplicarPullTarefas(
  tarefas: TarefaResponse[],
  idUsuario: number,
  novoCursor: string
): Promise<void> {
  const db = await getDatabase(idUsuario);

  await db.withExclusiveTransactionAsync(
    async (txn) => {
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
    }
  );
}