import type { DisciplinaResponse } from "../../types";

export const listarDisciplinasLocais = async (
  _idUsuario: number
): Promise<DisciplinaResponse[]> => {
  return [];
};

export const salvarCacheDisciplinas = async (
  _idUsuario: number,
  _disciplinas: DisciplinaResponse[],
  _substituirTudo: boolean
): Promise<void> => {
  // A versão web não utiliza SQLite para cache de disciplinas.
};