export type TarefaRequest = {
  idUsuario: number;
  idDisciplina: number;
  titulo: string;
  tipo: string;
  descricao?: string;
  dataHoraInicio?: string | null;
  dataEntrega: string;
  prioridade: string;
};

export type TarefaReferencia = {
  idTarefa?: number;
  localId?: string;
};

export type TarefaResponse = {
  // Presente depois que a tarefa existe no servidor.
  idTarefa?: number;

  // Presente no aplicativo mobile.
  localId?: string;

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

  updatedAt?: string;
  deletedAt?: string | null;
  version?: number;

  // Estado da sincronização no aplicativo mobile.
  syncStatus?: "PENDING" | "SYNCED" | "ERROR";
};