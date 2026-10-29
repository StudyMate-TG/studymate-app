import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

export type UsuarioResponse = {
  idUsuario: number;
  nome: string;
  email: string;
  curso: string | null;
  semestre?: string | null;
  matricula: string | null;
  instituicao: string | null;
  emailAlteracaoPendente?: boolean;
};

export type DisciplinaResponse = {
  idDisciplina: number;
  idPeriodo: number;
  nomePeriodo: string;
  nome: string;
  professor: string;
  mediaAprovacao: number;
  limiteFaltas: number;
};

export type DisciplinaRequest = {
  idUsuario: number;
  idPeriodo?: number;
  nome: string;
  professor: string;
  mediaAprovacao: number;
  limiteFaltas: number;
};

export type PeriodoLetivoStatus =
  | "ATIVO"
  | "INATIVO"
  | "CONCLUIDO";

export type PeriodoLetivoResponse = {
  idPeriodo: number;
  idUsuario: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: PeriodoLetivoStatus;
};

export type PeriodoLetivoRequest = {
  idUsuario: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: PeriodoLetivoStatus;
};

export type HorarioAulaResponse = {
  idHorario: number;
  idDisciplina: number;
  nomeDisciplina: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  local: string | null;
  dataInicioPeriodo: string;
  dataFimPeriodo: string;
};

export type HorarioAulaRequest = {
  idDisciplina: number;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  local?: string | null;
};

export type RootStackParamList = {
  Login: undefined;

  MainTabs: undefined;

  NewSubject: undefined;

  EditSubject: {
    idDisciplina: number;
  };

  NewTask: undefined;

  EditTask: {
    idTarefa?: number;
    localId?: string;
  };

  NewAttendance: undefined;

  Evaluations: {
    idDisciplina: number;
    nomeDisciplina: string;
  };

  NewEvaluation: {
    idDisciplina: number;
    nomeDisciplina: string;
  };

  EditEvaluation: {
    idAvaliacao: number;
    idDisciplina: number;
    nomeDisciplina: string;
  };

  Notifications: undefined;
  EditProfile: undefined;

  Periods: undefined;

  NewPeriod: undefined;

  ClassSchedules: {
  idDisciplina: number;
  nomeDisciplina: string;
};

  NewClassSchedule: {
    idDisciplina: number;
    nomeDisciplina: string;
  };

  EditClassSchedule: {
    idHorario: number;
    idDisciplina: number;
    nomeDisciplina: string;
  };
};

export type MainTabParamList = {
  HomeTab: undefined;
  SubjectsTab: undefined;
  CalendarTab: undefined;
  AchievementsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackScreenProps<
  T extends keyof RootStackParamList
> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<
  T extends keyof MainTabParamList
> = BottomTabScreenProps<
  MainTabParamList,
  T
>;
