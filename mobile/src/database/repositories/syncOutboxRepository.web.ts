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

export async function criarOperacaoOutbox(
  _entityLocalId: string,
  _entityType: string,
  _operation: OutboxOperation,
  _payload: unknown
): Promise<SyncOutboxItem> {
  throw new Error(
    "A fila de sincronização está disponível apenas no aplicativo mobile."
  );
}

export async function listarOperacoesPendentes(): Promise<
  SyncOutboxItem[]
> {
  return [];
}

export async function marcarOperacaoComoProcessando(
  _id: number
): Promise<void> {
  return;
}

export async function marcarOperacaoComoSincronizada(
  _id: number
): Promise<void> {
  return;
}

export async function marcarOperacaoComErro(
  _id: number,
  _erro: string
): Promise<void> {
  return;
}

export async function removerOperacaoOutbox(
  _id: number
): Promise<void> {
  return;
}