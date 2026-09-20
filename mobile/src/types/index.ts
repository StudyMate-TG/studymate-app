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
  idPeriodo?:number;
  nome: string;
  professor: string;
  mediaAprovacao: number;
  limiteFaltas: number;
};

export type PeriodoLetivoStatus = "ATIVO" | "INATIVO" | "CONCLUIDO";

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

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  NewSubject: undefined;
  EditSubject: { idDisciplina: number };
  NewTask: undefined;
  NewAttendance: undefined;
  EditProfile: undefined;
  Periods: undefined;
  NewPeriod: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SubjectsTab: undefined;
  CalendarTab: undefined;
  AchievementsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;