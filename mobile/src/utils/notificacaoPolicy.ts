/** RF12 defaults mirror backend NotificacaoPolicy: task 24h, evaluation eve 18h/day 8h, absences 75/100%. Academic dates use America/Sao_Paulo. Change both defaults together when configuring offline reminders. */
export const HORAS_ANTECEDENCIA_TAREFA = 24;
const FUSO_ACADEMICO = "America/Sao_Paulo";

export function instanteAcademico(valor: string): Date | null {
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(valor)) {
    const date = new Date(valor);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/.exec(valor.trim());
  if (!partes) return null;
  const [ano, mes, dia, hora, minuto, segundo] = partes.slice(1).map((x) => Number(x ?? 0));
  const alvo = Date.UTC(ano, mes - 1, dia, hora, minuto, segundo);
  const validacao = new Date(alvo);
  if (validacao.getUTCFullYear() !== ano || validacao.getUTCMonth() !== mes - 1
    || validacao.getUTCDate() !== dia || hora > 23 || minuto > 59 || segundo > 59) return null;
  const formatar = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO_ACADEMICO, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  let instante = alvo;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(formatar.formatToParts(instante).map((item) => [item.type, item.value]));
    const observado = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    instante += alvo - observado;
  }
  return new Date(instante);
}
export function horarioLembreteTarefa(entrega: string): Date | null {
  const data = instanteAcademico(entrega);
  return data ? new Date(data.getTime() - HORAS_ANTECEDENCIA_TAREFA * 3600000) : null;
}
export function horariosLembreteAvaliacao(avaliacao: string): { dia: Date; vespera: Date } | null {
  const data = avaliacao.trim().split("T")[0];
  const dia = instanteAcademico(`${data}T08:00:00`);
  if (!dia) return null;
  const anterior = new Date(`${data}T00:00:00Z`);
  anterior.setUTCDate(anterior.getUTCDate() - 1);
  const vespera = instanteAcademico(`${anterior.toISOString().slice(0, 10)}T18:00:00`);
  return vespera ? { dia, vespera } : null;
}
export function nivelAlertaFaltas(total: number, limite: number): 0 | 75 | 100 {
  if (!Number.isFinite(total) || !Number.isFinite(limite) || total < 0 || limite < 0) return 0;
  if (limite === 0) return total > 0 ? 100 : 0;
  return total >= limite ? 100 : total / limite >= 0.75 ? 75 : 0;
}
