import * as Crypto from "expo-crypto";

import { getDatabase } from "../database";

export type SyncStatus =
  | "PENDING"
  | "SYNCED"
  | "ERROR";

export type LocalTarefa = {
  localId: string;
  serverId: number | null;
  idDisciplina: number;
  nomeDisciplina: string;
  titulo: string;
  tipo: string;
  descricao: string | null;
  dataHoraInicio: string | null;
  dataEntrega: string;
  dataConclusao: string | null;
  status: string;
  prioridade: string;
  xpGerado: number;
  serverVersion: number | null;
  syncStatus: SyncStatus;
  updatedAtLocal: string;
};

export type CriarLocalTarefa = {
  idDisciplina: number;
  nomeDisciplina?: string;
  titulo: string;
  tipo: string;
  descricao?: string | null;
  dataHoraInicio?: string | null;
  dataEntrega: string;
  prioridade: string;
};

type LocalTarefaRow = {
  local_id: string;
  server_id: number | null;
  id_disciplina: number;
  nome_disciplina: string;
  titulo: string;
  tipo: string;
  descricao: string | null;
  data_hora_inicio: string | null;
  data_entrega: string;
  data_conclusao: string | null;
  status: string;
  prioridade: string;
  xp_gerado: number;
  server_version: number | null;
  sync_status: SyncStatus;
  updated_at_local: string;
};

function mapearTarefa(
  row: LocalTarefaRow
): LocalTarefa {
  return {
    localId: row.local_id,
    serverId: row.server_id,
    idDisciplina: row.id_disciplina,
    nomeDisciplina:
      row.nome_disciplina ?? "",
    titulo: row.titulo,
    tipo: row.tipo,
    descricao: row.descricao,
    dataHoraInicio:
      row.data_hora_inicio,
    dataEntrega: row.data_entrega,
    dataConclusao:
      row.data_conclusao,
    status: row.status,
    prioridade: row.prioridade,
    xpGerado: row.xp_gerado,
    serverVersion:
      row.server_version,
    syncStatus:
      row.sync_status,
    updatedAtLocal:
      row.updated_at_local,
  };
}

export async function criarTarefaLocal(
  dados: CriarLocalTarefa
): Promise<LocalTarefa> {
  const db = await getDatabase();

  const localId =
    Crypto.randomUUID();

  const agora =
    new Date().toISOString();

  await db.runAsync(
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
    dados.idDisciplina,
    dados.nomeDisciplina ?? "",
    dados.titulo,
    dados.tipo,
    dados.descricao ?? null,
    dados.dataHoraInicio ?? null,
    dados.dataEntrega,
    null,
    "PENDENTE",
    dados.prioridade,
    0,
    null,
    "PENDING",
    agora
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

export async function listarTarefasLocais(): Promise<
  LocalTarefa[]
> {
  const db = await getDatabase();

  const rows =
    await db.getAllAsync<LocalTarefaRow>(
      `
        SELECT
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
        FROM local_tarefa
        WHERE NOT EXISTS (
          SELECT 1
          FROM sync_outbox o
          WHERE
            o.entity_local_id =
              local_tarefa.local_id
            AND o.entity_type = 'TAREFA'
            AND o.operation = 'DELETE'
            AND o.status IN (
              'PENDING',
              'PROCESSING',
              'ERROR'
            )
        )
        ORDER BY data_entrega ASC
      `
    );

  return rows.map(mapearTarefa);
}

export async function buscarTarefaLocalPorLocalId(
  localId: string
): Promise<LocalTarefa | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<LocalTarefaRow>(
      `
        SELECT
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
        FROM local_tarefa
        WHERE local_id = ?
      `,
      localId
    );

  return row
    ? mapearTarefa(row)
    : null;
}

export async function buscarTarefaLocalPorServerId(
  serverId: number
): Promise<LocalTarefa | null> {
  const db = await getDatabase();

  const row =
    await db.getFirstAsync<LocalTarefaRow>(
      `
        SELECT
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
        FROM local_tarefa
        WHERE server_id = ?
      `,
      serverId
    );

  return row
    ? mapearTarefa(row)
    : null;
}

export async function removerTarefaLocalDefinitivamente(
  localId: string
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      DELETE FROM local_tarefa
      WHERE local_id = ?
    `,
    localId
  );
}