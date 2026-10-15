import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CANAL_LEMBRETES = "lembretes";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configurarNotificacoes(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        CANAL_LEMBRETES,
        {
          name: "Lembretes",
          importance:
            Notifications.AndroidImportance.HIGH,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
        }
      );
    }

    const permissaoAtual =
      await Notifications.getPermissionsAsync();

    let permitido =
      permissaoAtual.granted;

    if (!permitido) {
      const solicitacao =
        await Notifications.requestPermissionsAsync();

      permitido =
        solicitacao.granted;
    }

    return permitido;
  } catch (error) {
    console.warn(
      "Erro ao configurar notificações:",
      error
    );

    return false;
  }
}

export async function listarNotificacoesAgendadas() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function testarNotificacao(): Promise<string | null> {
  const permitido =
    await configurarNotificacoes();

  if (!permitido) {
    return null;
  }

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title:
          "Teste StudyMate",

        body:
          "As notificações estão funcionando.",

        sound:
          "default",

        data: {
          tipo:
            "TESTE",
        },
      },

      trigger: {
        type:
          Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,

        seconds:
          10,
      },
    });
  } catch (error) {
    console.warn(
      "Erro ao criar notificação de teste:",
      error
    );

    return null;
  }
}

async function cancelarPorFiltro(
  filtro: (
    notificacao:
      Notifications.NotificationRequest
  ) => boolean
): Promise<number> {
  const notificacoes =
    await Notifications.getAllScheduledNotificationsAsync();

  const notificacoesParaCancelar =
    notificacoes.filter(
      filtro
    );

  for (
    const notificacao
    of notificacoesParaCancelar
  ) {
    await Notifications.cancelScheduledNotificationAsync(
      notificacao.identifier
    );
  }

  return notificacoesParaCancelar.length;
}

/* =========================================================
 * TAREFAS
 * =======================================================*/

export type ReferenciaNotificacaoTarefa = {
  localId?: string;
  idTarefa?: number;
};

export type AgendarNotificacaoTarefaParams =
  ReferenciaNotificacaoTarefa & {
    titulo: string;
    nomeDisciplina?: string;
    dataEntrega: string;
  };

export async function cancelarNotificacoesTarefa({
  localId,
  idTarefa,
}: ReferenciaNotificacaoTarefa): Promise<number> {
  try {
    return await cancelarPorFiltro(
      (
        notificacao
      ) => {
        const data =
          notificacao.content.data;

        if (
          data?.tipo !==
          "TAREFA"
        ) {
          return false;
        }

        const mesmoLocalId =
          Boolean(
            localId
          ) &&
          String(
            data?.localId ??
              ""
          ) ===
            String(
              localId
            );

        const mesmoIdTarefa =
          idTarefa !==
            undefined &&
          idTarefa !==
            null &&
          Number(
            data?.idTarefa
          ) ===
            Number(
              idTarefa
            );

        return (
          mesmoLocalId ||
          mesmoIdTarefa
        );
      }
    );
  } catch (error) {
    console.warn(
      "Erro ao cancelar lembrete da tarefa:",
      error
    );

    return 0;
  }
}

export async function agendarNotificacaoTarefa({
  localId,
  idTarefa,
  titulo,
  nomeDisciplina,
  dataEntrega,
}: AgendarNotificacaoTarefaParams): Promise<string | null> {
  const permitido =
    await configurarNotificacoes();

  if (!permitido) {
    return null;
  }

  await cancelarNotificacoesTarefa({
    localId,
    idTarefa,
  });

  const entrega =
    new Date(
      dataEntrega
    );

  if (
    Number.isNaN(
      entrega.getTime()
    )
  ) {
    console.warn(
      "Data de entrega inválida para notificação:",
      dataEntrega
    );

    return null;
  }

  const dataNotificacao =
    new Date(
      entrega.getTime() -
        24 *
          60 *
          60 *
          1000
    );

  if (
    dataNotificacao.getTime() <=
    Date.now()
  ) {
    return null;
  }

  try {
    const mensagem =
      nomeDisciplina
        ? `${titulo} de ${nomeDisciplina} vence amanhã.`
        : `${titulo} vence amanhã.`;

    const dados:
      Record<
        string,
        string | number
      > = {
      tipo:
        "TAREFA",
    };

    if (localId) {
      dados.localId =
        localId;
    }

    if (
      idTarefa !==
        undefined &&
      idTarefa !== null
    ) {
      dados.idTarefa =
        idTarefa;
    }

    return await Notifications.scheduleNotificationAsync(
      {
        content: {
          title:
            "Tarefa próxima do prazo",

          body:
            mensagem,

          sound:
            "default",

          data:
            dados,
        },

        trigger: {
          type:
            Notifications.SchedulableTriggerInputTypes.DATE,

          date:
            dataNotificacao,
        },
      }
    );
  } catch (error) {
    console.warn(
      "Erro ao agendar lembrete da tarefa:",
      error
    );

    return null;
  }
}

export const reagendarNotificacaoTarefa =
  agendarNotificacaoTarefa;

/* =========================================================
 * AVALIAÇÕES
 * =======================================================*/

export async function cancelarNotificacoesAvaliacao(
  idAvaliacao: number
): Promise<number> {
  try {
    const notificacoes =
      await Notifications.getAllScheduledNotificationsAsync();

    const encontradas =
      notificacoes.filter(
        (
          notificacao
        ) => {
          const data =
            notificacao.content.data;

          const tipo =
            String(
              data?.tipo ??
                ""
            );

          const ehAvaliacao =
            tipo ===
              "AVALIACAO_VESPERA" ||
            tipo ===
              "AVALIACAO_DIA";

          const mesmoId =
            Number(
              data?.idAvaliacao
            ) ===
            Number(
              idAvaliacao
            );

          return (
            ehAvaliacao &&
            mesmoId
          );
        }
      );

    for (
      const notificacao
      of encontradas
    ) {
      await Notifications.cancelScheduledNotificationAsync(
        notificacao.identifier
      );
    }

    return encontradas.length;
  } catch (error) {
    console.warn(
      `Erro ao cancelar notificações da avaliação ${idAvaliacao}:`,
      error
    );

    return 0;
  }
}

function converterDataAvaliacao(
  data: string,
  hora: number,
  minuto: number
): Date | null {
  const dataSemHorario =
    data
      .trim()
      .split("T")[0];

  const partes =
    dataSemHorario.split(
      "-"
    );

  if (
    partes.length !== 3
  ) {
    return null;
  }

  const ano =
    Number(
      partes[0]
    );

  const mes =
    Number(
      partes[1]
    );

  const dia =
    Number(
      partes[2]
    );

  if (
    !Number.isInteger(
      ano
    ) ||
    !Number.isInteger(
      mes
    ) ||
    !Number.isInteger(
      dia
    )
  ) {
    return null;
  }

  const resultado =
    new Date(
      ano,
      mes - 1,
      dia,
      hora,
      minuto,
      0,
      0
    );

  if (
    resultado.getFullYear() !==
      ano ||
    resultado.getMonth() !==
      mes - 1 ||
    resultado.getDate() !==
      dia
  ) {
    return null;
  }

  return resultado;
}

export type AgendarNotificacoesAvaliacaoParams =
  {
    idAvaliacao: number;
    nome: string;
    nomeDisciplina?: string;
    dataAvaliacao: string;
  };

export async function agendarNotificacoesAvaliacao({
  idAvaliacao,
  nome,
  nomeDisciplina,
  dataAvaliacao,
}: AgendarNotificacoesAvaliacaoParams): Promise<
  string[]
> {
  const permitido =
    await configurarNotificacoes();

  if (!permitido) {
    return [];
  }

  await cancelarNotificacoesAvaliacao(
    idAvaliacao
  );

  const dataDia =
    converterDataAvaliacao(
      dataAvaliacao,
      8,
      0
    );

  if (!dataDia) {
    console.warn(
      "Data da avaliação inválida:",
      dataAvaliacao
    );

    return [];
  }

  const dataVespera =
    new Date(
      dataDia.getFullYear(),
      dataDia.getMonth(),
      dataDia.getDate() -
        1,
      18,
      0,
      0,
      0
    );

  const ids: string[] =
    [];

  if (
    dataVespera.getTime() >
    Date.now()
  ) {
    const mensagem =
      nomeDisciplina
        ? `${nome} de ${nomeDisciplina} acontece amanhã.`
        : `${nome} acontece amanhã.`;

    const idVespera =
      await Notifications.scheduleNotificationAsync(
        {
          content: {
            title:
              "Avaliação amanhã",

            body:
              mensagem,

            sound:
              "default",

            data: {
              tipo:
                "AVALIACAO_VESPERA",

              idAvaliacao,
            },
          },

          trigger: {
            type:
              Notifications.SchedulableTriggerInputTypes.DATE,

            date:
              dataVespera,
          },
        }
      );

    ids.push(
      idVespera
    );
  }

  if (
    dataDia.getTime() >
    Date.now()
  ) {
    const mensagem =
      nomeDisciplina
        ? `${nome} de ${nomeDisciplina} é hoje.`
        : `${nome} é hoje.`;

    const idDia =
      await Notifications.scheduleNotificationAsync(
        {
          content: {
            title:
              "Avaliação hoje",

            body:
              mensagem,

            sound:
              "default",

            data: {
              tipo:
                "AVALIACAO_DIA",

              idAvaliacao,
            },
          },

          trigger: {
            type:
              Notifications.SchedulableTriggerInputTypes.DATE,

            date:
              dataDia,
          },
        }
      );

    ids.push(
      idDia
    );
  }

  return ids;
}

/* =========================================================
 * FALTAS
 * =======================================================*/

type NivelAlertaFalta =
  | 0
  | 75
  | 100;

export type VerificarNotificacaoFaltasParams =
  {
    idUsuario: number;
    idDisciplina: number;
    nomeDisciplina: string;
    totalFaltas: number;
    limiteFaltas: number;
  };

function obterChaveFaltas(
  idUsuario: number,
  idDisciplina: number
): string {
  return `@studymate:notificacao:faltas:${idUsuario}:${idDisciplina}`;
}

function calcularNivelFaltas(
  totalFaltas: number,
  limiteFaltas: number
): NivelAlertaFalta {
  if (
    limiteFaltas <= 0
  ) {
    return 0;
  }

  const percentual =
    (
      totalFaltas /
      limiteFaltas
    ) *
    100;

  if (
    percentual >= 100
  ) {
    return 100;
  }

  if (
    percentual >= 75
  ) {
    return 75;
  }

  return 0;
}

export async function verificarNotificacaoFaltas({
  idUsuario,
  idDisciplina,
  nomeDisciplina,
  totalFaltas,
  limiteFaltas,
}: VerificarNotificacaoFaltasParams): Promise<void> {
  if (
    limiteFaltas <= 0
  ) {
    return;
  }

  try {
    const permitido =
      await configurarNotificacoes();

    if (!permitido) {
      return;
    }

    const chave =
      obterChaveFaltas(
        idUsuario,
        idDisciplina
      );

    const nivelAtual =
      calcularNivelFaltas(
        totalFaltas,
        limiteFaltas
      );

    const armazenado =
      await AsyncStorage.getItem(
        chave
      );

    const nivelAnteriorNumero =
      armazenado
        ? Number(
            armazenado
          )
        : 0;

    const nivelAnterior:
      NivelAlertaFalta =
      nivelAnteriorNumero ===
        100
        ? 100
        : nivelAnteriorNumero ===
            75
          ? 75
          : 0;

    if (
      nivelAtual <
      nivelAnterior
    ) {
      await AsyncStorage.setItem(
        chave,
        String(
          nivelAtual
        )
      );

      return;
    }

    if (
      nivelAtual ===
      nivelAnterior
    ) {
      return;
    }

    if (
      nivelAtual === 0
    ) {
      await AsyncStorage.setItem(
        chave,
        "0"
      );

      return;
    }

    const percentual =
      Math.round(
        (
          totalFaltas /
          limiteFaltas
        ) *
          100
      );

    if (
      nivelAtual === 75
    ) {
      await Notifications.scheduleNotificationAsync(
        {
          content: {
            title:
              "Atenção às faltas",

            body:
              `${nomeDisciplina}: você atingiu ${percentual}% do limite de faltas (${totalFaltas}/${limiteFaltas}).`,

            sound:
              "default",

            data: {
              tipo:
                "FALTAS_75",

              idDisciplina,

              idUsuario,
            },
          },

          trigger:
            null,
        }
      );

      await AsyncStorage.setItem(
        chave,
        "75"
      );

      return;
    }

    if (
      nivelAtual === 100
    ) {
      await Notifications.scheduleNotificationAsync(
        {
          content: {
            title:
              "Limite de faltas atingido",

            body:
              `${nomeDisciplina}: você atingiu o limite de faltas (${totalFaltas}/${limiteFaltas}).`,

            sound:
              "default",

            data: {
              tipo:
                "FALTAS_100",

              idDisciplina,

              idUsuario,
            },
          },

          trigger:
            null,
        }
      );

      await AsyncStorage.setItem(
        chave,
        "100"
      );
    }
  } catch (error) {
    console.warn(
      "Erro ao verificar alerta de faltas:",
      error
    );
  }
}