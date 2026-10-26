import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { getSessionGeneration, onSessionEnded, requireSessionUser } from "./apiClient";
import { horarioLembreteTarefa, horariosLembreteAvaliacao, nivelAlertaFaltas } from "../utils/notificacaoPolicy";

const CANAL_LEMBRETES = "lembretes";
let operacao: Promise<unknown> = Promise.resolve();
let revisaoLembretes = 0;
export const getRevisaoLembretes = (): number => revisaoLembretes;
const serializar = <T>(acao: () => Promise<T>): Promise<T> => {
  const proxima = operacao.then(acao, acao);
  operacao = proxima.catch(() => undefined);
  return proxima;
};
const sessaoAtual = (usuario: number, geracao: number): boolean => {
  try { return requireSessionUser(usuario) === usuario && getSessionGeneration() === geracao; }
  catch { return false; }
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async (notificacao) => {
      const dono = Number(notificacao.request.content.data?.idUsuario);
      let atual = false;
      try { atual = requireSessionUser() === dono; } catch { /* Signed out. */ }
      return { shouldShowBanner: atual, shouldShowList: atual, shouldPlaySound: atual, shouldSetBadge: false };
    },
  });
}

export async function configurarNotificacoes(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
        name: "Lembretes", importance: Notifications.AndroidImportance.HIGH,
        sound: "default", vibrationPattern: [0, 250, 250, 250],
      });
    }
    const atual = await Notifications.getPermissionsAsync();
    return atual.granted || (await Notifications.requestPermissionsAsync()).granted;
  } catch (error) { console.warn("Não foi possível configurar lembretes locais.", error); return false; }
}

export async function listarNotificacoesAgendadas() {
  if (Platform.OS === "web") return [];
  const usuario = requireSessionUser();
  return (await Notifications.getAllScheduledNotificationsAsync())
    .filter((item) => Number(item.content.data?.idUsuario) === usuario);
}

/** Device reminders are separate from the backend inbox. No remote push is sent. */
export function cancelarTodosLembretesLocais(): Promise<void> {
  revisaoLembretes++;
  return serializar(async () => {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  });
}

onSessionEnded(() => { void cancelarTodosLembretesLocais().catch((error) => console.warn("Não foi possível limpar lembretes.", error)); });

async function cancelarPorFiltro(usuario: number, filtro: (data: Record<string, unknown>) => boolean): Promise<number> {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  const encontradas = agendadas.filter((item) => Number(item.content.data?.idUsuario) === usuario && filtro(item.content.data ?? {}));
  for (const item of encontradas) await Notifications.cancelScheduledNotificationAsync(item.identifier);
  return encontradas.length;
}

export type ReferenciaNotificacaoTarefa = { localId?: string; idTarefa?: number; idUsuario?: number };
export type AgendarNotificacaoTarefaParams = ReferenciaNotificacaoTarefa & {
  titulo: string; nomeDisciplina?: string; dataEntrega: string;
};
const mesmaTarefa = (data: Record<string, unknown>, ref: ReferenciaNotificacaoTarefa): boolean =>
  data.tipo === "TAREFA" && (Boolean(ref.localId && data.localId === ref.localId)
    || (ref.idTarefa !== undefined && Number(data.idTarefa) === ref.idTarefa));

export function cancelarNotificacoesTarefa(ref: ReferenciaNotificacaoTarefa): Promise<number> {
  revisaoLembretes++;
  if (Platform.OS === "web") return Promise.resolve(0);
  const usuario = requireSessionUser(ref.idUsuario);
  const geracao = getSessionGeneration();
  return serializar(async () => sessaoAtual(usuario, geracao)
    ? cancelarPorFiltro(usuario, (data) => mesmaTarefa(data, ref)) : 0);
}

async function agendarSeguro(usuario: number, geracao: number, identifier: string,
  title: string, body: string, data: Record<string, string | number>, date: Date | null): Promise<string | null> {
  if (!sessaoAtual(usuario, geracao)) return null;
  const id = await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, sound: "default", data: { ...data, idUsuario: usuario } },
    trigger: date ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CANAL_LEMBRETES } : null,
  });
  // An OS call can resolve after logout. Remove its result before the next queued operation.
  if (!sessaoAtual(usuario, geracao)) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await Notifications.dismissNotificationAsync(id);
    return null;
  }
  return id;
}

export function agendarNotificacaoTarefa(params: AgendarNotificacaoTarefaParams): Promise<string | null> {
  if (Platform.OS === "web") return Promise.resolve(null);
  const usuario = requireSessionUser(params.idUsuario);
  const geracao = getSessionGeneration();
  revisaoLembretes++;
  return serializar(() => agendarTarefaNaFila(params, usuario, geracao));
}
async function agendarTarefaNaFila(params: AgendarNotificacaoTarefaParams, usuario: number, geracao: number): Promise<string | null> {
    if (!sessaoAtual(usuario, geracao)) return null;
    await cancelarPorFiltro(usuario, (data) => mesmaTarefa(data, params));
    const data = horarioLembreteTarefa(params.dataEntrega);
    if (!data || data.getTime() <= Date.now() || !(await configurarNotificacoes())) return null;
    const dados: Record<string, string | number> = { tipo: "TAREFA" };
    if (params.localId) dados.localId = params.localId;
    if (params.idTarefa !== undefined) dados.idTarefa = params.idTarefa;
    return agendarSeguro(usuario, geracao, `studymate:${usuario}:tarefa:${params.localId ?? params.idTarefa}`,
      "Tarefa próxima do prazo", `${params.titulo}${params.nomeDisciplina ? ` de ${params.nomeDisciplina}` : ""} vence em 24 horas.`, dados, data);
}

export const reagendarNotificacaoTarefa = agendarNotificacaoTarefa;

export function cancelarNotificacoesAvaliacao(idAvaliacao: number, idUsuario?: number): Promise<number> {
  revisaoLembretes++;
  if (Platform.OS === "web") return Promise.resolve(0);
  const usuario = requireSessionUser(idUsuario);
  const geracao = getSessionGeneration();
  return serializar(async () => sessaoAtual(usuario, geracao) ? cancelarPorFiltro(usuario, (data) =>
    ["AVALIACAO_VESPERA", "AVALIACAO_DIA"].includes(String(data.tipo)) && Number(data.idAvaliacao) === idAvaliacao) : 0);
}
export type AgendarNotificacoesAvaliacaoParams = { idUsuario?: number; idDisciplina?: number; idAvaliacao: number; nome: string; nomeDisciplina?: string; dataAvaliacao: string };
export function agendarNotificacoesAvaliacao(params: AgendarNotificacoesAvaliacaoParams): Promise<string[]> {
  if (Platform.OS === "web") return Promise.resolve([]);
  const usuario = requireSessionUser(params.idUsuario);
  const geracao = getSessionGeneration();
  revisaoLembretes++;
  return serializar(() => agendarAvaliacaoNaFila(params, usuario, geracao));
}
async function agendarAvaliacaoNaFila(params: AgendarNotificacoesAvaliacaoParams, usuario: number, geracao: number): Promise<string[]> {
    if (!sessaoAtual(usuario, geracao)) return [];
    await cancelarPorFiltro(usuario, (data) => ["AVALIACAO_VESPERA", "AVALIACAO_DIA"].includes(String(data.tipo))
      && Number(data.idAvaliacao) === params.idAvaliacao);
    const datas = horariosLembreteAvaliacao(params.dataAvaliacao);
    if (!datas || !(await configurarNotificacoes())) return [];
    const ids: string[] = [];
    for (const [tipo, date, texto] of [
      ["AVALIACAO_VESPERA", datas.vespera, "amanhã"], ["AVALIACAO_DIA", datas.dia, "hoje"],
    ] as const) {
      if (date.getTime() <= Date.now()) continue;
      const id = await agendarSeguro(usuario, geracao, `studymate:${usuario}:${tipo}:${params.idAvaliacao}`,
        `Avaliação ${texto}`, `${params.nome}${params.nomeDisciplina ? ` de ${params.nomeDisciplina}` : ""} acontece ${texto}.`,
        { tipo, idAvaliacao: params.idAvaliacao, ...(params.idDisciplina === undefined ? {} : { idDisciplina: params.idDisciplina }) }, date);
      if (id) ids.push(id);
    }
    return ids;
}

export type VerificarNotificacaoFaltasParams = {
  idUsuario: number; idDisciplina: number; nomeDisciplina: string; totalFaltas: number; limiteFaltas: number;
};
export function verificarNotificacaoFaltas(params: VerificarNotificacaoFaltasParams): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  const usuario = requireSessionUser(params.idUsuario);
  const geracao = getSessionGeneration();
  return serializar(async () => {
    if (!sessaoAtual(usuario, geracao)) return;
    const chave = `@studymate:notificacao:faltas:${usuario}:${params.idDisciplina}`;
    const nivel = nivelAlertaFaltas(params.totalFaltas, params.limiteFaltas);
    const anterior = Number(await AsyncStorage.getItem(chave) ?? "0");
    if (!sessaoAtual(usuario, geracao)) return;
    if (nivel <= anterior || nivel === 0) { await AsyncStorage.setItem(chave, String(nivel)); return; }
    if (!(await configurarNotificacoes())) return;
    const id = await agendarSeguro(usuario, geracao, `studymate:${usuario}:faltas:${params.idDisciplina}:${nivel}`,
      nivel === 100 ? "Limite de faltas atingido" : "Atenção às faltas",
      `${params.nomeDisciplina}: ${params.totalFaltas}/${params.limiteFaltas} faltas (${nivel}% do limite atingido).`,
      { tipo: `FALTAS_${nivel}`, idDisciplina: params.idDisciplina }, null);
    if (id && sessaoAtual(usuario, geracao)) await AsyncStorage.setItem(chave, String(nivel));
  });
}
export function testarNotificacao(): Promise<string | null> {
  if (Platform.OS === "web") return Promise.resolve(null);
  const usuario = requireSessionUser();
  const geracao = getSessionGeneration();
  return serializar(async () => (await configurarNotificacoes()) ? agendarSeguro(usuario, geracao,
    `studymate:${usuario}:teste`, "Teste StudyMate", "Os lembretes locais estão funcionando.", { tipo: "TESTE" }, new Date(Date.now() + 10000)) : null);
}

/** Rebuild from the committed local snapshot, including remote tombstones and completions. */
export async function reconciliarLembretesTarefas(tarefas: Array<{
  localId: string; serverId: number | null; titulo: string; nomeDisciplina?: string; dataEntrega: string; status: string;
}>, idUsuario: number, revisaoEsperada = revisaoLembretes): Promise<void> {
  if (Platform.OS === "web") return;
  const usuario = requireSessionUser(idUsuario);
  const geracao = getSessionGeneration();
  const pendentes = tarefas.filter((tarefa) => tarefa.status === "PENDENTE");
  await serializar(async () => {
    if (!sessaoAtual(usuario, geracao) || revisaoEsperada !== revisaoLembretes) return;
    await cancelarPorFiltro(usuario, (data) => data.tipo === "TAREFA" && !pendentes.some((tarefa) =>
      mesmaTarefa(data, { localId: tarefa.localId, idTarefa: tarefa.serverId ?? undefined })));
    for (const tarefa of pendentes) {
    if (!sessaoAtual(usuario, geracao) || revisaoEsperada !== revisaoLembretes) return;
      await agendarTarefaNaFila({ ...tarefa, idTarefa: tarefa.serverId ?? undefined, idUsuario }, usuario, geracao);
    }
  });
}

export async function reconciliarLembretesAvaliacoes(avaliacoes: Array<{
  idAvaliacao: number; nome: string; dataAvaliacao: string; nota: number | null;
}>, idUsuario: number, idDisciplina: number, revisaoEsperada = revisaoLembretes): Promise<void> {
  if (Platform.OS === "web") return;
  const usuario = requireSessionUser(idUsuario);
  const geracao = getSessionGeneration();
  const pendentes = avaliacoes.filter((item) => item.nota === null);
  await serializar(async () => {
    if (!sessaoAtual(usuario, geracao) || revisaoEsperada !== revisaoLembretes) return;
    await cancelarPorFiltro(usuario, (data) => ["AVALIACAO_VESPERA", "AVALIACAO_DIA"].includes(String(data.tipo))
      && Number(data.idDisciplina) === idDisciplina && !pendentes.some((item) => item.idAvaliacao === Number(data.idAvaliacao)));
    for (const item of pendentes) {
    if (!sessaoAtual(usuario, geracao) || revisaoEsperada !== revisaoLembretes) return;
      await agendarAvaliacaoNaFila({ ...item, idUsuario, idDisciplina }, usuario, geracao);
    }
  });
}
