export type UsuarioResponse = {
  idUsuario: number;
  nome: string;
  email: string;
  curso: string | null;
  semestre: string | null;
  matricula: string | null;
  instituicao: string | null;
};

export type DisciplinaResponse = {
  idDisciplina: number;
  idPeriodo: number;
  nome: string;
  professor: string | null;
  mediaAprovacao: number;
  limiteFaltas: number;
};

export type DisciplinaRequest = {
  idPeriodo: number;
  nome: string;
  professor: string;
  mediaAprovacao: number;
  limiteFaltas: number;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  NewSubject: undefined;
  EditSubject: { idDisciplina: number };
  NewTask: undefined;
  NewAttendance: undefined;
  EditProfile: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SubjectsTab: undefined;
  CalendarTab: undefined;
  AchievementsTab: undefined;
  ProfileTab: undefined;
};
