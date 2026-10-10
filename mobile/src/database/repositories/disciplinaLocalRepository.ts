import { getDatabase } from "../database";

import type {
  DisciplinaResponse,
} from "../../types";

type LocalDisciplinaRow = {
  id_disciplina: number;
  id_periodo: number;
  nome_periodo: string;
  nome: string;
  professor: string;
  media_aprovacao: number;
  limite_faltas: number;
};

function mapearRow(
  row: LocalDisciplinaRow
): DisciplinaResponse {
  return {
    idDisciplina: row.id_disciplina,
    idPeriodo: row.id_periodo,
    nomePeriodo: row.nome_periodo,
    nome: row.nome,
    professor: row.professor,
    mediaAprovacao: row.media_aprovacao,
    limiteFaltas: row.limite_faltas,
  };
}

export async function listarDisciplinasLocais(
  idUsuario: number
): Promise<DisciplinaResponse[]> {
  const db = await getDatabase(
    idUsuario
  );

  const rows =
    await db.getAllAsync<LocalDisciplinaRow>(
      `
        SELECT
          id_disciplina,
          id_periodo,
          nome_periodo,
          nome,
          professor,
          media_aprovacao,
          limite_faltas
        FROM local_disciplina
        ORDER BY nome COLLATE NOCASE ASC
      `
    );

  return rows.map(mapearRow);
}

export async function salvarCacheDisciplinas(
  idUsuario: number,
  disciplinas: DisciplinaResponse[],
  substituirTudo = true
): Promise<void> {
  const db = await getDatabase(
    idUsuario
  );

  const agora =
    new Date().toISOString();

  await db.withExclusiveTransactionAsync(
    async (txn) => {
      if (substituirTudo) {
        await txn.runAsync(
          "DELETE FROM local_disciplina"
        );
      }

      for (const disciplina of disciplinas) {
        await txn.runAsync(
          `
            INSERT INTO local_disciplina (
              id_disciplina,
              id_periodo,
              nome_periodo,
              nome,
              professor,
              media_aprovacao,
              limite_faltas,
              updated_at_local
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(id_disciplina)
            DO UPDATE SET
              id_periodo = excluded.id_periodo,
              nome_periodo = excluded.nome_periodo,
              nome = excluded.nome,
              professor = excluded.professor,
              media_aprovacao = excluded.media_aprovacao,
              limite_faltas = excluded.limite_faltas,
              updated_at_local =
                excluded.updated_at_local
          `,
          disciplina.idDisciplina,
          disciplina.idPeriodo,
          disciplina.nomePeriodo,
          disciplina.nome,
          disciplina.professor,
          disciplina.mediaAprovacao,
          disciplina.limiteFaltas,
          agora
        );
      }
    }
  );
}