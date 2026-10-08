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

export async function criarTarefaLocal(
  _dados: CriarLocalTarefa
): Promise<LocalTarefa> {
  throw new Error(
    "SQLite local disponível apenas na versão Mobile."
  );
}

export async function listarTarefasLocais(): Promise<
  LocalTarefa[]
> {
  return [];
}

export async function buscarTarefaLocalPorLocalId(
  _localId: string
): Promise<LocalTarefa | null> {
  return null;
}

export async function buscarTarefaLocalPorServerId(
  _serverId: number
): Promise<LocalTarefa | null> {
  return null;
}

export async function removerTarefaLocalDefinitivamente(
  _localId: string
): Promise<void> {
  return;
}