import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  CalendarDays,
  CheckCircle2,
  X,
} from "lucide-react-native";

import type {
  RootStackScreenProps,
} from "../types";

import {
  obterUsuarioSessao,
} from "../services/authService";

import {
  listarPresencas,
  type PresencaResponse,
} from "../services/presencaService";

import {
  listarFaltas,
  type FaltaResponse,
} from "../services/faltaService";

import {
  MobileHeader,
} from "../components/MobileHeader";

import {
  Card,
} from "../components/Card";

type Props =
  RootStackScreenProps<"FrequencyHistory">;

type RegistroFrequencia =
  | {
      chave: string;
      tipo: "PRESENCA";
      data: string;
      presenca: PresencaResponse;
    }
  | {
      chave: string;
      tipo: "FALTA";
      data: string;
      falta: FaltaResponse;
    };

export const FrequencyHistoryScreen:
  React.FC<Props> = ({
    navigation,
    route,
  }) => {
    const {
      idDisciplina,
      nomeDisciplina,
      limiteFaltas,
    } = route.params;

    const [
      presencas,
      setPresencas,
    ] = useState<PresencaResponse[]>([]);

    const [
      faltas,
      setFaltas,
    ] = useState<FaltaResponse[]>([]);

    const [
      carregando,
      setCarregando,
    ] = useState(true);

    const [
      erro,
      setErro,
    ] = useState("");

    const carregarHistorico =
      useCallback(async () => {
        try {
          setCarregando(true);
          setErro("");

          const usuario =
            await obterUsuarioSessao();

          if (!usuario?.idUsuario) {
            navigation.replace("Login");
            return;
          }

          const [
            dadosPresencas,
            dadosFaltas,
          ] = await Promise.all([
            listarPresencas(
              usuario.idUsuario,
              idDisciplina
            ),

            listarFaltas(
              idDisciplina,
              usuario.idUsuario
            ),
          ]);

          setPresencas(
            dadosPresencas
          );

          setFaltas(
            dadosFaltas
          );
        } catch (error) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o histórico de frequência."
          );
        } finally {
          setCarregando(false);
        }
      }, [
        idDisciplina,
        navigation,
      ]);

    useFocusEffect(
      useCallback(() => {
        void carregarHistorico();
      }, [carregarHistorico])
    );

    const totalFaltas =
      useMemo(
        () =>
          faltas.reduce(
            (
              total,
              falta
            ) =>
              total +
              falta.quantidadeAulas,
            0
          ),
        [faltas]
      );

      const totalAulasPresentes =
        useMemo(
          () =>
            presencas.reduce(
              (total, presenca) =>
                total +
                presenca.quantidadeAulas,
              0
            ),
          [presencas]
        );

    const registros =
      useMemo<RegistroFrequencia[]>(
        () => {
          const itens:
            RegistroFrequencia[] = [
              ...presencas.map(
                (presenca) => ({
                  chave:
                    `presenca-${presenca.idPresenca}`,
                  tipo:
                    "PRESENCA" as const,
                  data:
                    presenca.dataPresenca,
                  presenca,
                })
              ),

              ...faltas.map(
                (falta) => ({
                  chave:
                    `falta-${falta.idFalta}`,
                  tipo:
                    "FALTA" as const,
                  data:
                    falta.dataFalta,
                  falta,
                })
              ),
            ];

          return itens.sort(
            (a, b) =>
              b.data.localeCompare(
                a.data
              )
          );
        },
        [
          presencas,
          faltas,
        ]
      );

    const formatarData = (
      data: string
    ) => {
      const [
        ano,
        mes,
        dia,
      ] = data.substring(
        0,
        10
      ).split("-");

      if (
        !ano ||
        !mes ||
        !dia
      ) {
        return data;
      }

      return `${dia}/${mes}/${ano}`;
    };

    const renderRegistro = ({
      item,
    }: {
      item: RegistroFrequencia;
    }) => {
      const isPresenca =
        item.tipo ===
        "PRESENCA";

      return (
        <Card
          style={
            styles.historyCard
          }
        >
          <View
            style={
              styles.historyRow
            }
          >
            <View
              style={[
                styles.iconContainer,

                isPresenca
                  ? styles.presenceIcon
                  : styles.absenceIcon,
              ]}
            >
              {isPresenca ? (
                <CheckCircle2
                  size={21}
                  color="#16A34A"
                />
              ) : (
                <X
                  size={21}
                  color="#DC2626"
                />
              )}
            </View>

            <View
              style={
                styles.historyContent
              }
            >
              <Text
                style={[
                  styles.historyType,

                  isPresenca
                    ? styles.presenceText
                    : styles.absenceText,
                ]}
              >
                {isPresenca
                  ? "Presença"
                  : "Falta"}
              </Text>

              <View
                style={
                  styles.dateRow
                }
              >
                <CalendarDays
                  size={14}
                  color="#64748B"
                />

                <Text
                  style={
                    styles.dateText
                  }
                >
                  {formatarData(
                    item.data
                  )}
                </Text>
              </View>

              {item.tipo === "PRESENCA" ? (
                <View>
                  <Text style={styles.detailText}>
                    {item.presenca.quantidadeAulas}{" "}
                    {item.presenca.quantidadeAulas === 1
                      ? "aula assistida"
                      : "aulas assistidas"}
                  </Text>

                  <Text style={styles.detailText}>
                    +{item.presenca.xpGerado} XP registrados
                  </Text>
                </View>
              ) : (
                <Text style={styles.detailText}>
                  {item.falta.quantidadeAulas}{" "}
                  {item.falta.quantidadeAulas === 1
                    ? "aula perdida"
                    : "aulas perdidas"}
                </Text>
              )}
            </View>
          </View>
        </Card>
      );
    };

    return (
      <View
        style={
          styles.container
        }
      >
        <MobileHeader
          title="Frequência"
          showBack
          onBack={() =>
            navigation.goBack()
          }
        />

        {carregando ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Carregando histórico...
            </Text>
          </View>
        ) : (
          <FlatList
            data={registros}
            keyExtractor={(
              item
            ) => item.chave}
            renderItem={
              renderRegistro
            }
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={
              false
            }
            ListHeaderComponent={
              <>
                <Text
                  style={
                    styles.subjectName
                  }
                >
                  {nomeDisciplina}
                </Text>

                <View
                  style={
                    styles.summaryRow
                  }
                >
                  <View
                    style={
                      styles.summaryBox
                    }
                  >
                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      { totalAulasPresentes }
                    </Text>

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Aulas presentes
                    </Text>
                  </View>

                  <View
                    style={
                      styles.summaryBox
                    }
                  >
                    <Text
                      style={[
                        styles.summaryValue,

                        totalFaltas >=
                          limiteFaltas &&
                          limiteFaltas >
                            0 &&
                          styles.dangerText,
                      ]}
                    >
                      {totalFaltas}
                    </Text>

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Faltas
                    </Text>
                  </View>

                  <View
                    style={
                      styles.summaryBox
                    }
                  >
                    <Text
                      style={
                        styles.summaryValue
                      }
                    >
                      {
                        limiteFaltas
                      }
                    </Text>

                    <Text
                      style={
                        styles.summaryLabel
                      }
                    >
                      Limite
                    </Text>
                  </View>
                </View>

                {erro ? (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {erro}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Histórico
                </Text>
              </>
            }
            ListEmptyComponent={
              <Card
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Nenhum registro de frequência
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Ainda não existem presenças ou faltas registradas nesta disciplina.
                </Text>
              </Card>
            }
          />
        )}
      </View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F8FAFC",
    },

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: "#64748B",
    },

    listContent: {
      padding: 16,
      paddingBottom: 40,
      maxWidth: 600,
      width: "100%",
      alignSelf:
        "center",
    },

    subjectName: {
      fontSize: 20,
      fontWeight: "700",
      color: "#0F172A",
      marginBottom: 14,
    },

    summaryRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 20,
    },

    summaryBox: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      alignItems:
        "center",
    },

    summaryValue: {
      fontSize: 20,
      fontWeight: "800",
      color: "#0F172A",
    },

    summaryLabel: {
      marginTop: 3,
      fontSize: 11,
      color: "#64748B",
    },

    dangerText: {
      color: "#DC2626",
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#0F172A",
      marginBottom: 10,
    },

    historyCard: {
      marginBottom: 10,
    },

    historyRow: {
      flexDirection: "row",
      alignItems:
        "center",
    },

    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    presenceIcon: {
      backgroundColor:
        "#DCFCE7",
    },

    absenceIcon: {
      backgroundColor:
        "#FEE2E2",
    },

    historyContent: {
      flex: 1,
    },

    historyType: {
      fontSize: 15,
      fontWeight: "700",
    },

    presenceText: {
      color: "#15803D",
    },

    absenceText: {
      color: "#B91C1C",
    },

    dateRow: {
      flexDirection: "row",
      alignItems:
        "center",
      gap: 5,
      marginTop: 4,
    },

    dateText: {
      fontSize: 13,
      color: "#64748B",
    },

    detailText: {
      marginTop: 3,
      fontSize: 12,
      color: "#475569",
    },

    emptyCard: {
      padding: 24,
      alignItems:
        "center",
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#0F172A",
    },

    emptyText: {
      marginTop: 5,
      fontSize: 13,
      lineHeight: 19,
      color: "#64748B",
      textAlign: "center",
    },

    errorText: {
      marginBottom: 14,
      color: "#DC2626",
      fontSize: 13,
    },
  });